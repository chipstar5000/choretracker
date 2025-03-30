import db from '../../../lib/db';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getChores(req, res);
    case 'POST':
      return createChore(req, res);
    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getChores(req, res) {
  const { memberId, showCompleted = 'false', timeframe = 'today' } = req.query;
  
  try {
    let query;
    let params = [];
    
    // Base query to get chores with their assignments
    query = `
      SELECT c.id, c.name, c.details, c.due_date, c.repeat_type, 
             c.completed as chore_completed,
             ca.completed as assignment_completed, 
             ca.family_member_id,
             fm.name as assigned_to_name,
             fm.color as assigned_to_color
      FROM chores c
      JOIN chore_assignments ca ON c.id = ca.chore_id
      JOIN family_members fm ON ca.family_member_id = fm.id
      WHERE 1=1
    `;
    
    // Filter by member ID if provided
    if (memberId) {
      query += ` AND ca.family_member_id = ?`;
      params.push(memberId);
    }
    
    // Filter by completion status
    if (showCompleted === 'false') {
      query += ` AND ca.completed = 0`;
    }
    
    // Filter by timeframe
    if (timeframe === 'today') {
      query += ` AND (date(c.due_date) = date('now') OR c.repeat_type = 'daily')`;
    } else if (timeframe === 'week') {
      query += ` AND (date(c.due_date) BETWEEN date('now') AND date('now', '+7 days') OR c.repeat_type IN ('daily', 'weekly'))`;
    }
    
    query += ` ORDER BY c.due_date ASC, c.id ASC`;
    
    const result = await db.query(query, params);
    
    // Group results by chore
    const chores = result.rows.reduce((acc, row) => {
      const choreId = row.id;
      
      if (!acc[choreId]) {
        acc[choreId] = {
          id: choreId,
          name: row.name,
          details: row.details,
          dueDate: row.due_date,
          repeatType: row.repeat_type,
          completed: Boolean(row.chore_completed),
          assignedTo: []
        };
      }
      
      acc[choreId].assignedTo.push({
        id: row.family_member_id,
        name: row.assigned_to_name,
        color: row.assigned_to_color,
        completed: Boolean(row.assignment_completed)
      });
      
      return acc;
    }, {});
    
    res.status(200).json(Object.values(chores));
  } catch (error) {
    console.error('Error fetching chores:', error);
    res.status(500).json({ error: 'Failed to fetch chores' });
  }
}

async function createChore(req, res) {
  const { name, details, dueDate, repeatType, assignedTo } = req.body;
  
  if (!name || !dueDate || !assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await db.getClient();
  
  try {
    // SQLite doesn't support RETURNING, so we need to handle it differently
    const choreResult = await client.query(
      `INSERT INTO chores (name, details, due_date, repeat_type) 
       VALUES (?, ?, ?, ?)`,
      [name, details || '', dueDate, repeatType || 'one-time']
    );
    
    const choreId = choreResult.rows[0]?.id;
    
    // Create assignments for each family member
    for (const memberId of assignedTo) {
      await client.query(
        `INSERT INTO chore_assignments (chore_id, family_member_id) 
         VALUES (?, ?)`,
        [choreId, memberId]
      );
    }
    
    res.status(201).json({ 
      id: choreId,
      name,
      details,
      dueDate,
      repeatType: repeatType || 'one-time',
      assignedTo
    });
  } catch (error) {
    console.error('Error creating chore:', error);
    res.status(500).json({ error: 'Failed to create chore' });
  } finally {
    client.release();
  }
}
import db from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      return getChore(req, res, id);
    case 'PUT':
      return updateChore(req, res, id);
    case 'DELETE':
      return deleteChore(req, res, id);
    default:
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getChore(req, res, id) {
  const isPostgres = process.env.USE_POSTGRES === 'true';
  
  try {
    // Query using the appropriate parameter syntax
    const choreResult = await db.query(
      `SELECT id, name, details, due_date, repeat_type, completed FROM chores WHERE id = ${isPostgres ? '$1' : '?'}`,
      [id]
    );
    
    if (choreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    const chore = choreResult.rows[0];
    
    // Get assignments
    const assignmentsResult = await db.query(
      `SELECT ca.family_member_id, fm.name, fm.color, ca.completed 
       FROM chore_assignments ca 
       JOIN family_members fm ON ca.family_member_id = fm.id 
       WHERE ca.chore_id = ${isPostgres ? '$1' : '?'}`,
      [id]
    );
    
    res.status(200).json({
      id: chore.id,
      name: chore.name,
      details: chore.details,
      dueDate: chore.due_date,
      repeatType: chore.repeat_type,
      completed: Boolean(chore.completed),
      assignedTo: assignmentsResult.rows.map(row => ({
        id: row.family_member_id,
        name: row.name,
        color: row.color,
        completed: Boolean(row.completed)
      }))
    });
  } catch (error) {
    console.error('Error fetching chore:', error);
    res.status(500).json({ error: 'Failed to fetch chore: ' + error.message });
  }
}

async function updateChore(req, res, id) {
  const { name, details, dueDate, repeatType, completed, assignedTo } = req.body;
  const isPostgres = process.env.USE_POSTGRES === 'true';
  
  const client = await db.getClient();
  
  try {
    // Check if chore exists
    const checkResult = await client.query(
      `SELECT id FROM chores WHERE id = ${isPostgres ? '$1' : '?'}`, 
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // Update chore details if provided
    if (name || details !== undefined || dueDate || repeatType || completed !== undefined) {
      let updateFields = [];
      let params = [];
      let paramIndex = 1; // For PostgreSQL
      
      if (name) {
        updateFields.push(`name = ${isPostgres ? `$${paramIndex++}` : '?'}`);
        params.push(name);
      }
      
      if (details !== undefined) {
        updateFields.push(`details = ${isPostgres ? `$${paramIndex++}` : '?'}`);
        params.push(details);
      }
      
      if (dueDate) {
        updateFields.push(`due_date = ${isPostgres ? `$${paramIndex++}` : '?'}`);
        params.push(dueDate);
      }
      
      if (repeatType) {
        updateFields.push(`repeat_type = ${isPostgres ? `$${paramIndex++}` : '?'}`);
        params.push(repeatType);
      }
      
      if (completed !== undefined) {
        updateFields.push(`completed = ${isPostgres ? `$${paramIndex++}` : '?'}`);
        params.push(isPostgres ? completed : completed ? 1 : 0);
      }
      
      if (updateFields.length > 0) {
        params.push(id);
        await client.query(
          `UPDATE chores SET ${updateFields.join(', ')} WHERE id = ${isPostgres ? `$${paramIndex}` : '?'}`,
          params
        );
      }
    }
    
    // Update assignments if provided
    if (assignedTo && Array.isArray(assignedTo)) {
      // Get current assignments
      const currentAssignments = await client.query(
        `SELECT family_member_id FROM chore_assignments WHERE chore_id = ${isPostgres ? '$1' : '?'}`,
        [id]
      );
      
      const currentMemberIds = currentAssignments.rows.map(row => row.family_member_id);
      
      // Find assignments to add and remove
      const toAdd = assignedTo.filter(memberId => !currentMemberIds.includes(memberId));
      const toRemove = currentMemberIds.filter(memberId => !assignedTo.includes(memberId));
      
      // Add new assignments
      for (const memberId of toAdd) {
        await client.query(
          `INSERT INTO chore_assignments (chore_id, family_member_id) VALUES (${isPostgres ? '$1, $2' : '?, ?'})`,
          [id, memberId]
        );
      }
      
      // Remove old assignments
      for (const memberId of toRemove) {
        await client.query(
          `DELETE FROM chore_assignments WHERE chore_id = ${isPostgres ? '$1' : '?'} AND family_member_id = ${isPostgres ? '$2' : '?'}`,
          [id, memberId]
        );
      }
    }
    
    // Get updated chore data
    const updatedChore = await getChoreData(id);
    res.status(200).json(updatedChore);
  } catch (error) {
    console.error('Error updating chore:', error);
    res.status(500).json({ error: 'Failed to update chore: ' + error.message });
  } finally {
    client.release();
  }
}

async function deleteChore(req, res, id) {
  const isPostgres = process.env.USE_POSTGRES === 'true';
  
  try {
    // Check if chore exists
    const checkResult = await db.query(
      `SELECT id FROM chores WHERE id = ${isPostgres ? '$1' : '?'}`,
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // Delete chore (will cascade to assignments due to FK constraints)
    await db.query(
      `DELETE FROM chores WHERE id = ${isPostgres ? '$1' : '?'}`,
      [id]
    );
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting chore:', error);
    res.status(500).json({ error: 'Failed to delete chore: ' + error.message });
  }
}

// Helper function to get full chore data
async function getChoreData(id) {
  const isPostgres = process.env.USE_POSTGRES === 'true';
  
  const choreResult = await db.query(
    `SELECT id, name, details, due_date, repeat_type, completed FROM chores WHERE id = ${isPostgres ? '$1' : '?'}`,
    [id]
  );
  
  if (choreResult.rows.length === 0) {
    return null;
  }
  
  const chore = choreResult.rows[0];
  
  // Get assignments
  const assignmentsResult = await db.query(
    `SELECT ca.family_member_id, fm.name, fm.color, ca.completed 
     FROM chore_assignments ca 
     JOIN family_members fm ON ca.family_member_id = fm.id 
     WHERE ca.chore_id = ${isPostgres ? '$1' : '?'}`,
    [id]
  );
  
  return {
    id: chore.id,
    name: chore.name,
    details: chore.details,
    dueDate: chore.due_date,
    repeatType: chore.repeat_type,
    completed: Boolean(chore.completed),
    assignedTo: assignmentsResult.rows.map(row => ({
      id: row.family_member_id,
      name: row.name,
      color: row.color,
      completed: Boolean(row.completed)
    }))
  };
}
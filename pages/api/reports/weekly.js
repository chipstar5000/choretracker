import db from '../../../lib/db';

export default async function handler(req, res) {
  const { memberId } = req.query;
  const isPostgres = process.env.USE_POSTGRES === 'true';
  
  if (!memberId) {
    return res.status(400).json({ error: 'Member ID is required' });
  }
  
  try {
    // Get family member info
    const memberResult = await db.query(
      `SELECT id, name, color FROM family_members WHERE id = ${isPostgres ? '$1' : '?'}`,
      [memberId]
    );
    
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    const member = memberResult.rows[0];
    
    // Calculate date from one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0];
    
    // Get chores assigned to this member in the last week
    let query;
    if (isPostgres) {
      // PostgreSQL version
      query = `SELECT c.id, c.name, c.details, c.due_date, c.repeat_type, 
                ca.completed, ca.completed_at
               FROM chores c
               JOIN chore_assignments ca ON c.id = ca.chore_id
               WHERE ca.family_member_id = $1
               AND (c.due_date::date >= $2::date OR c.repeat_type IN ('daily', 'weekly'))
               ORDER BY c.due_date ASC`;
    } else {
      // SQLite version
      query = `SELECT c.id, c.name, c.details, c.due_date, c.repeat_type, 
                ca.completed, ca.completed_at
               FROM chores c
               JOIN chore_assignments ca ON c.id = ca.chore_id
               WHERE ca.family_member_id = ?
               AND (date(c.due_date) >= date(?) OR c.repeat_type IN ('daily', 'weekly'))
               ORDER BY c.due_date ASC`;
    }
    
    const choresResult = await db.query(query, [memberId, formattedDate]);
    
    // Count completed and total chores
    const totalChores = choresResult.rows.length;
    const completedChores = choresResult.rows.filter(row => Boolean(row.completed)).length;
    const completionPercentage = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;
    
    // Get incomplete chores
    const incompleteChores = choresResult.rows
      .filter(row => !Boolean(row.completed))
      .map(row => ({
        id: row.id,
        name: row.name,
        details: row.details,
        dueDate: row.due_date,
        repeatType: row.repeat_type
      }));
    
    res.status(200).json({
      member: {
        id: member.id,
        name: member.name,
        color: member.color
      },
      report: {
        totalChores,
        completedChores,
        completionPercentage,
        incompleteChores
      },
      reportPeriod: {
        from: formattedDate,
        to: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report: ' + error.message });
  }
}
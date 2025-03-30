import db from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { choreId, memberId, completed = true } = req.body;
  
  if (!choreId || !memberId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await db.getClient();
  const isPostgres = process.env.USE_POSTGRES === 'true';
  console.log(`Updating chore completion using ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
  
  try {
    // Update the assignment completion status
    if (isPostgres) {
      // PostgreSQL version
      await client.query(
        `UPDATE chore_assignments 
         SET completed = $1, completed_at = $2 
         WHERE chore_id = $3 AND family_member_id = $4`,
        [completed, completed ? new Date().toISOString() : null, choreId, memberId]
      );
      
      // Check if all assignments are complete, and if so, mark the chore as complete
      const assignmentsResult = await client.query(
        'SELECT completed FROM chore_assignments WHERE chore_id = $1',
        [choreId]
      );
      
      const allComplete = assignmentsResult.rows.every(row => Boolean(row.completed));
      
      await client.query(
        'UPDATE chores SET completed = $1 WHERE id = $2',
        [allComplete, choreId]
      );
    } else {
      // SQLite version
      await client.query(
        `UPDATE chore_assignments 
         SET completed = ?, completed_at = ? 
         WHERE chore_id = ? AND family_member_id = ?`,
        [completed ? 1 : 0, completed ? new Date().toISOString() : null, choreId, memberId]
      );
      
      // Check if all assignments are complete, and if so, mark the chore as complete
      const assignmentsResult = await client.query(
        'SELECT completed FROM chore_assignments WHERE chore_id = ?',
        [choreId]
      );
      
      const allComplete = assignmentsResult.rows.every(row => Boolean(row.completed));
      
      await client.query(
        'UPDATE chores SET completed = ? WHERE id = ?',
        [allComplete ? 1 : 0, choreId]
      );
    }
    
    res.status(200).json({ success: true, choreId, memberId, completed });
  } catch (error) {
    console.error('Error updating chore completion:', error);
    res.status(500).json({ error: 'Failed to update chore completion: ' + error.message });
  } finally {
    client.release();
  }
}
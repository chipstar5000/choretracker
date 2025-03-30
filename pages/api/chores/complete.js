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
  console.log(`Params - choreId: ${choreId} (${typeof choreId}), memberId: ${memberId} (${typeof memberId}), completed: ${completed} (${typeof completed})`);
  
  try {
    // Update the assignment completion status
    if (isPostgres) {
      // PostgreSQL version
      // Convert boolean to boolean for PostgreSQL
      const postgresCompleted = completed === 'true' || completed === true;
      console.log(`PostgreSQL completed value: ${postgresCompleted}`);
      
      const updateQuery = `UPDATE chore_assignments 
                           SET completed = $1, completed_at = $2 
                           WHERE chore_id = $3 AND family_member_id = $4`;
                           
      console.log('Executing query:', updateQuery);
      console.log('With params:', [postgresCompleted, postgresCompleted ? new Date().toISOString() : null, choreId, memberId]);
      
      await client.query(
        updateQuery,
        [postgresCompleted, postgresCompleted ? new Date().toISOString() : null, choreId, memberId]
      );
      
      // Check if all assignments are complete, and if so, mark the chore as complete
      const selectQuery = 'SELECT completed FROM chore_assignments WHERE chore_id = $1';
      console.log('Executing query:', selectQuery);
      console.log('With params:', [choreId]);
      
      const assignmentsResult = await client.query(
        selectQuery,
        [choreId]
      );
      
      console.log('Assignment results:', assignmentsResult.rows);
      const allComplete = assignmentsResult.rows.every(row => row.completed === true);
      console.log('All complete:', allComplete);
      
      const updateChoreQuery = 'UPDATE chores SET completed = $1 WHERE id = $2';
      console.log('Executing query:', updateChoreQuery);
      console.log('With params:', [allComplete, choreId]);
      
      await client.query(
        updateChoreQuery,
        [allComplete, choreId]
      );
    } else {
      // SQLite version
      const sqliteCompleted = completed === 'true' || completed === true ? 1 : 0;
      console.log(`SQLite completed value: ${sqliteCompleted}`);
      
      await client.query(
        `UPDATE chore_assignments 
         SET completed = ?, completed_at = ? 
         WHERE chore_id = ? AND family_member_id = ?`,
        [sqliteCompleted, sqliteCompleted ? new Date().toISOString() : null, choreId, memberId]
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
    console.error('Error updating chore completion - Full error:', error);
    // Extract the query from the error if available
    const queryInfo = error.query ? `Query: ${error.query}` : '';
    res.status(500).json({ 
      error: 'Failed to update chore completion: ' + error.message,
      details: queryInfo,
      code: error.code,
      position: error.position
    });
  } finally {
    client.release();
  }
}
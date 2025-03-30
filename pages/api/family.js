import db from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await db.query('SELECT id, name, color FROM family_members ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
}
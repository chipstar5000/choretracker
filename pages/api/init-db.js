import db from '../../lib/db';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed` 
    });
  }
  
  try {
    // Initialize the database
    await db.initializeDatabase();
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    // Log the detailed error for debugging
    console.error('Error initializing database:', error);
    
    // Return a user-friendly error message
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to initialize database',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}
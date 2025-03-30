import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function SetupPage() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const initializeDb = async () => {
    setIsLoading(true);
    setStatus('Initializing database...');
    setError(null);
    
    try {
      const response = await fetch('/api/init-db', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('The server returned an invalid response. This might indicate that the database connection failed.');
      }
      
      if (!response.ok) {
        throw new Error(data?.error || `Server responded with status ${response.status}`);
      }
      
      if (data.success) {
        setStatus('✅ Database initialized successfully! You can now start using the application.');
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error during database initialization:', error);
      setStatus('❌ Database initialization failed');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>ChoreTracker Setup</title>
        <meta name="description" content="Setup page for ChoreTracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          ChoreTracker Setup
        </h1>
        
        <p className={styles.description}>
          Initialize your database to start using ChoreTracker
        </p>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={initializeDb}
            disabled={isLoading}
            className={styles.addButton}
            style={{ 
              padding: '0.8rem 2rem',
              fontSize: '1.2rem',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Initializing...' : 'Initialize Database'}
          </button>
          
          {status && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              backgroundColor: status.includes('✅') ? '#e6f7e6' : status.includes('❌') ? '#ffebee' : '#e3f2fd',
              maxWidth: '500px'
            }}>
              {status}
              
              {error && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  backgroundColor: '#fff0f0', 
                  borderRadius: '0.25rem',
                  fontSize: '0.9rem',
                  color: '#d32f2f',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {error}
                </div>
              )}
            </div>
          )}
          
          {status.includes('✅') && (
            <div style={{ marginTop: '2rem' }}>
              <a href="/" className={styles.addButton} style={{ 
                textDecoration: 'none',
                padding: '0.6rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#4CAF50'
              }}>
                Go to Application
              </a>
            </div>
          )}
          
          <div style={{ 
            marginTop: '3rem', 
            fontSize: '0.9rem', 
            color: '#666', 
            maxWidth: '600px', 
            textAlign: 'left' 
          }}>
            <h3>Troubleshooting</h3>
            <ul style={{ textAlign: 'left' }}>
              <li>Make sure your database connection string is correctly set in Vercel environment variables</li>
              <li>For Neon databases, ensure the <code>USE_POSTGRES</code> environment variable is set to <code>true</code></li>
              <li>Check that the database user has permissions to create tables</li>
              <li>If using SQLite locally, ensure the data directory is writable</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
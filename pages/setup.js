import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function SetupPage() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const initializeDb = async () => {
    setIsLoading(true);
    setStatus('Initializing database...');
    
    try {
      const response = await fetch('/api/init-db', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setStatus('✅ Database initialized successfully! You can now start using the application.');
      } else {
        setStatus('❌ Error: ' + (data.error || 'Unknown error occurred'));
      }
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
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
        </div>
      </main>
    </div>
  );
}
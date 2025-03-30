import Head from 'next/head';
import { useState, useEffect } from 'react';
import ChoreList from '../components/ChoreList';
import AddChoreForm from '../components/AddChoreForm';
import WeeklyReport from '../components/WeeklyReport';
import FamilyOverview from '../components/FamilyOverview';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [familyMember, setFamilyMember] = useState(null);
  const [showAddChoreForm, setShowAddChoreForm] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showFamilyOverview, setShowFamilyOverview] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [timeframe, setTimeframe] = useState('today');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const familyMembers = [
    { id: 1, name: 'Chip', color: 'blue' },
    { id: 2, name: 'Catherine', color: 'green' },
    { id: 3, name: 'Charlotte', color: 'pink' },
    { id: 4, name: 'Celine', color: 'purple' }
  ];

  // Initialize database when app starts
  useEffect(() => {
    const initDB = async () => {
      try {
        const response = await fetch('/api/init-db', { method: 'POST' });
        if (!response.ok) {
          console.error('Failed to initialize database');
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    initDB();
  }, []);

  if (!familyMember) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Family Chore Tracker</title>
          <meta name="description" content="Track family chores" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>Who are you?</h1>
          
          <div className={styles.grid}>
            {familyMembers.map((member) => (
              <button
                key={member.id}
                className={styles.card}
                style={{ borderColor: member.color }}
                onClick={() => setFamilyMember(member)}
              >
                <h2>{member.name}</h2>
              </button>
            ))}
          </div>
          
          <button 
            className={styles.overviewButton}
            onClick={() => setShowFamilyOverview(true)}
          >
            View All Family Chores
          </button>
        </main>
        
        {showFamilyOverview && (
          <FamilyOverview onClose={() => setShowFamilyOverview(false)} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{familyMember.name}'s Chores</title>
        <meta name="description" content="Track family chores" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title} style={{ color: familyMember.color }}>
          {familyMember.name}'s Chores
        </h1>
        
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterButton} ${timeframe === 'today' ? styles.active : ''}`}
              onClick={() => setTimeframe('today')}
            >
              Today
            </button>
            <button 
              className={`${styles.filterButton} ${timeframe === 'week' ? styles.active : ''}`}
              onClick={() => setTimeframe('week')}
            >
              This Week
            </button>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
              />
              Show Completed
            </label>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddChoreForm(true)}
          >
            + Add Chore
          </button>
          <button 
            className={styles.reportButton}
            onClick={() => setShowWeeklyReport(true)}
          >
            Weekly Report
          </button>
        </div>

        <ChoreList 
          familyMember={familyMember}
          timeframe={timeframe}
          showCompleted={showCompleted}
          refreshTrigger={refreshTrigger}
        />

        <button 
          className={styles.backButton}
          onClick={() => setFamilyMember(null)}
        >
          Switch Family Member
        </button>
      </main>

      {showAddChoreForm && (
        <AddChoreForm 
          onClose={() => setShowAddChoreForm(false)} 
          onChoreAdded={() => {
            // Increment the refresh trigger to cause the chore list to refresh
            setRefreshTrigger(prev => prev + 1);
            setShowAddChoreForm(false);
          }}
        />
      )}

      {showWeeklyReport && (
        <WeeklyReport 
          familyMember={familyMember} 
          onClose={() => setShowWeeklyReport(false)}
        />
      )}
    </div>
  );
}
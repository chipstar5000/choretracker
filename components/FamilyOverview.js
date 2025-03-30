import { useState, useEffect } from 'react';
import styles from '../styles/FamilyOverview.module.css';
import ChoreItem from './ChoreItem';

export default function FamilyOverview({ onClose }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [chores, setChores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('today');
  
  // Fetch family members
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch('/api/family');
        if (!response.ok) {
          throw new Error('Failed to fetch family members');
        }
        const data = await response.json();
        setFamilyMembers(data);
      } catch (err) {
        console.error('Error fetching family members:', err);
        setError('Failed to load family members. Please try again.');
      }
    };
    
    fetchFamilyMembers();
  }, []);
  
  // Fetch all chores for all family members
  useEffect(() => {
    const fetchAllChores = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/chores?showCompleted=false&timeframe=${timeframe}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch chores');
        }
        
        const data = await response.json();
        
        // Organize chores by family member
        const choresByMember = {};
        
        // Initialize empty arrays for each member
        familyMembers.forEach(member => {
          choresByMember[member.id] = [];
        });
        
        // Populate chores for each member
        data.forEach(chore => {
          chore.assignedTo.forEach(assignment => {
            if (!choresByMember[assignment.id]) {
              choresByMember[assignment.id] = [];
            }
            
            choresByMember[assignment.id].push({
              ...chore,
              memberColor: assignment.color,
              memberCompleted: assignment.completed
            });
          });
        });
        
        setChores(choresByMember);
        setError(null);
      } catch (err) {
        console.error('Error fetching chores:', err);
        setError('Failed to load chores. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (familyMembers.length > 0) {
      fetchAllChores();
    }
  }, [familyMembers, timeframe]);
  
  const handleCompleteChore = async (choreId, memberId, completed) => {
    try {
      const response = await fetch('/api/chores/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choreId,
          memberId,
          completed
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update chore status');
      }
      
      // Update the local state instead of refetching
      setChores(prevChores => {
        const updatedChores = { ...prevChores };
        
        if (updatedChores[memberId]) {
          updatedChores[memberId] = updatedChores[memberId].map(chore => {
            if (chore.id === choreId) {
              return { ...chore, memberCompleted: completed };
            }
            return chore;
          });
        }
        
        return updatedChores;
      });
    } catch (err) {
      console.error('Error completing chore:', err);
      setError('Failed to update chore. Please try again.');
    }
  };
  
  if (loading && familyMembers.length > 0) {
    return <div className={styles.loading}>Loading chores...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Family Chore Overview</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.filters}>
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
        
        <div className={styles.familyGrid}>
          {familyMembers.map(member => (
            <div 
              key={member.id} 
              className={styles.memberColumn}
              style={{ borderColor: member.color }}
            >
              <h3 style={{ color: member.color }}>{member.name}</h3>
              <div className={styles.choreList}>
                {chores[member.id] && chores[member.id].length > 0 ? (
                  chores[member.id].map(chore => (
                    <ChoreItem
                      key={`${chore.id}-${member.id}`}
                      chore={{
                        ...chore,
                        assignedTo: [{ id: member.id, completed: chore.memberCompleted }]
                      }}
                      onComplete={handleCompleteChore}
                      onDelete={() => {}} // No delete functionality in overview
                      memberColor={member.color}
                    />
                  ))
                ) : (
                  <p className={styles.emptyList}>No chores</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
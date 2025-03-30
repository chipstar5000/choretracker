import { useState, useEffect } from 'react';
import ChoreItem from './ChoreItem';
import styles from '../styles/ChoreList.module.css';

export default function ChoreList({ familyMember, timeframe = 'today', showCompleted = false }) {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchChores = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/chores?memberId=${familyMember.id}&showCompleted=${showCompleted}&timeframe=${timeframe}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chores');
      }
      
      const data = await response.json();
      setChores(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching chores:', err);
      setError('Failed to load chores. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (familyMember) {
      fetchChores();
    }
  }, [familyMember, timeframe, showCompleted]);
  
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
      
      // Refresh chores list
      fetchChores();
    } catch (err) {
      console.error('Error completing chore:', err);
      setError('Failed to update chore. Please try again.');
    }
  };
  
  const handleDeleteChore = async (choreId) => {
    if (!confirm('Are you sure you want to delete this chore?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chores/${choreId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chore');
      }
      
      // Refresh chores list
      fetchChores();
    } catch (err) {
      console.error('Error deleting chore:', err);
      setError('Failed to delete chore. Please try again.');
    }
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading chores...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  if (chores.length === 0) {
    return (
      <div className={styles.emptyList}>
        <p>No chores found. Add some using the + button.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.choreList}>
      {chores.map(chore => (
        <ChoreItem
          key={chore.id}
          chore={chore}
          onComplete={handleCompleteChore}
          onDelete={handleDeleteChore}
          memberColor={familyMember.color}
        />
      ))}
    </div>
  );
}

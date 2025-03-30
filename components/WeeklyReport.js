import { useState, useEffect } from 'react';
import styles from '../styles/WeeklyReport.module.css';

export default function WeeklyReport({ familyMember, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/weekly?memberId=${familyMember.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch weekly report');
        }
        
        const data = await response.json();
        setReport(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load weekly report. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [familyMember]);
  
  if (loading) {
    return (
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Loading report...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContent}>
          <div className={styles.error}>{error}</div>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 style={{ color: familyMember.color }}>{familyMember.name}'s Weekly Report</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.reportContent}>
          <div className={styles.reportPeriod}>
            <p>Report period: {report.reportPeriod.from} to {report.reportPeriod.to}</p>
          </div>
          
          <div className={styles.reportStats}>
            <div 
              className={styles.completionPercentage}
              style={{ color: familyMember.color }}
            >
              {report.report.completionPercentage}%
            </div>
            
            <div className={styles.statDetails}>
              <p><strong>Total chores:</strong> {report.report.totalChores}</p>
              <p><strong>Completed:</strong> {report.report.completedChores}</p>
            </div>
          </div>
          
          <div className={styles.incompleteChores}>
            <h3>Incomplete Chores:</h3>
            
            {report.report.incompleteChores.length === 0 ? (
              <p className={styles.noneMessage}>Great job! No incomplete chores.</p>
            ) : (
              <ul className={styles.choresList}>
                {report.report.incompleteChores.map(chore => (
                  <li key={chore.id} className={styles.choreItem}>
                    <div className={styles.choreName}>{chore.name}</div>
                    {chore.details && <div className={styles.choreDetails}>{chore.details}</div>}
                    <div className={styles.choreDate}>
                      Due: {new Date(chore.dueDate).toLocaleDateString()}
                      {chore.repeatType !== 'one-time' && (
                        <span className={styles.repeatType}>
                          ({chore.repeatType === 'daily' ? 'Daily' : 'Weekly'})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className={styles.reportActions}>
          <button onClick={onClose} className={styles.closeButton}>Close Report</button>
        </div>
      </div>
    </div>
  );
}

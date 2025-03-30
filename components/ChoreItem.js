import { useState } from 'react';
import styles from '../styles/ChoreItem.module.css';

export default function ChoreItem({ chore, onComplete, onDelete, memberColor }) {
  const [expanded, setExpanded] = useState(false);
  
  // For family overview, we might have memberCompleted directly on the chore
  // Otherwise, find current member in the assigned list
  let currentMemberAssignment;
  let isCompleted;
  
  if (chore.memberCompleted !== undefined) {
    currentMemberAssignment = chore.assignedTo[0]; // In overview mode, there's only one member
    isCompleted = chore.memberCompleted;
  } else {
    currentMemberAssignment = chore.assignedTo.find(
      member => member.color === memberColor
    );
    isCompleted = currentMemberAssignment?.completed;
  }
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleComplete = async () => {
    if (currentMemberAssignment) {
      await onComplete(chore.id, currentMemberAssignment.id, !isCompleted);
    }
  };
  
  return (
    <div className={`${styles.choreItem} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.choreHeader}>
        <div className={styles.checkboxContainer}>
          <input 
            type="checkbox" 
            checked={isCompleted || false}
            onChange={handleComplete}
            className={styles.checkbox}
            id={`chore-${chore.id}`}
          />
          <label 
            htmlFor={`chore-${chore.id}`}
            className={styles.checkboxLabel}
          />
        </div>
        
        <div className={styles.choreName} onClick={toggleExpand}>
          <h3>{chore.name}</h3>
          {chore.repeatType !== 'one-time' && (
            <span className={styles.repeatBadge}>
              {chore.repeatType === 'daily' ? 'Daily' : 'Weekly'}
            </span>
          )}
        </div>
        
        <button 
          className={styles.expandButton} 
          onClick={toggleExpand}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      
      {expanded && (
        <div className={styles.choreDetails}>
          {chore.details && <p>{chore.details}</p>}
          
          <div className={styles.assignedTo}>
            <strong>Assigned to:</strong>
            <div className={styles.assigneeList}>
              {chore.assignedTo.map(member => (
                <span 
                  key={member.id} 
                  className={styles.assigneeBadge}
                  style={{ backgroundColor: member.color }}
                >
                  {member.name}
                  {member.completed && <span className={styles.checkmark}>✓</span>}
                </span>
              ))}
            </div>
          </div>
          
          {onDelete && (
            <div className={styles.choreActions}>
              <button
                className={styles.deleteButton}
                onClick={() => onDelete(chore.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import styles from '../styles/AddChoreForm.module.css';

export default function AddChoreForm({ onClose, onChoreAdded }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    dueDate: new Date().toISOString().split('T')[0],
    repeatType: 'one-time',
    assignedTo: []
  });
  
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
        setError('Failed to load family members');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFamilyMembers();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleMemberToggle = (memberId) => {
    setFormData(prev => {
      const currentAssignees = [...prev.assignedTo];
      
      if (currentAssignees.includes(memberId)) {
        return {
          ...prev,
          assignedTo: currentAssignees.filter(id => id !== memberId)
        };
      } else {
        return {
          ...prev,
          assignedTo: [...currentAssignees, memberId]
        };
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a chore name');
      return;
    }
    
    if (formData.assignedTo.length === 0) {
      alert('Please assign the chore to at least one family member');
      return;
    }
    
    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chore');
      }
      
      // Call the callback to refresh the chore list
      if (onChoreAdded) {
        onChoreAdded();
      }
      
      // Close the form
      onClose();
    } catch (err) {
      console.error('Error creating chore:', err);
      setError('Failed to create chore. Please try again.');
    }
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add New Chore</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Chore Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="details">Details (optional):</label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              className={styles.textarea}
              rows="3"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="dueDate">Due Date:</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="repeatType">Repeat:</label>
            <select
              id="repeatType"
              name="repeatType"
              value={formData.repeatType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="one-time">One Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Assign To:</label>
            <div className={styles.assigneeGrid}>
              {familyMembers.map(member => (
                <div key={member.id} className={styles.assigneeOption}>
                  <input
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={formData.assignedTo.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className={styles.checkbox}
                  />
                  <label 
                    htmlFor={`member-${member.id}`}
                    className={styles.assigneeLabel}
                    style={{ borderColor: member.color }}
                  >
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Add Chore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

## Ways to Initialize the Database

### Using curl
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/init-db
```

### Using Postman
1. Set the request type to POST
2. Enter the URL: https://your-vercel-domain.vercel.app/api/init-db
3. Click Send

### Using Fetch in Browser Console
```javascript
fetch('https://your-vercel-domain.vercel.app/api/init-db', {
  method: 'POST'
}).then(response => response.json()).then(data => console.log(data));
```

### In a Next.js Page (One-click Setup)
```jsx
import { useState } from 'react';

export default function SetupPage() {
  const [status, setStatus] = useState('');
  
  const initializeDb = async () => {
    setStatus('Initializing...');
    try {
      const response = await fetch('/api/init-db', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setStatus('Database initialized successfully!');
      } else {
        setStatus('Error: ' + data.error);
      }
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };
  
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>ChoreTracker Setup</h1>
      <button 
        onClick={initializeDb}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Initialize Database
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
```
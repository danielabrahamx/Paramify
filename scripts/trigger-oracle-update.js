const fetch = require('node-fetch');

async function triggerUpdate() {
  try {
    console.log('Triggering manual oracle update...');
    
    const response = await fetch('http://localhost:3001/api/manual-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Oracle update successful!');
      console.log('Transaction hash:', data.txHash);
    } else {
      console.log('❌ Oracle update failed:', data.error);
    }
    
  } catch (error) {
    console.error('Error triggering update:', error.message);
  }
}

triggerUpdate();

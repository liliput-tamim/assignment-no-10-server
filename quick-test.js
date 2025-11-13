// Quick test to check request flow
const axios = require('axios');

async function testRequestFlow() {
  const BASE_URL = 'http://localhost:4000';
  
  try {
    console.log('🔍 Testing request flow...\n');
    
    // Step 1: Create a partner
    const partner = await axios.post(`${BASE_URL}/partners`, {
      name: 'Test Partner',
      subject: 'Math',
      email: 'partner@test.com'
    });
    console.log('✅ Partner created:', partner.data._id);
    
    // Step 2: Send request
    const request = await axios.post(`${BASE_URL}/requests`, {
      partnerId: partner.data._id,
      message: 'Test message',
      senderEmail: 'student@test.com',
      senderName: 'Test Student'
    });
    console.log('✅ Request sent:', request.data._id);
    
    // Step 3: Check if request appears in connections
    const connections = await axios.get(`${BASE_URL}/requests/student@test.com`);
    console.log('✅ Connections found:', connections.data.length);
    
    if (connections.data.length > 0) {
      console.log('🎉 SUCCESS: Request appears in My Connections!');
    } else {
      console.log('❌ ISSUE: Request not found in My Connections');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRequestFlow();
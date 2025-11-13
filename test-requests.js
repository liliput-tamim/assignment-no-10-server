const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testRequests() {
  try {
    console.log('Testing Study Partner Request API...\n');

    // Test 1: Create a partner first
    console.log('1. Creating a test partner...');
    const partnerData = {
      name: 'Test Partner',
      subject: 'Mathematics',
      experienceLevel: 'Intermediate',
      email: 'partner@test.com',
      bio: 'Test partner for API testing'
    };

    const partnerResponse = await axios.post(`${BASE_URL}/partners`, partnerData);
    console.log('Partner created:', partnerResponse.data._id);
    const partnerId = partnerResponse.data._id;

    // Test 2: Send a partner request
    console.log('\n2. Sending partner request...');
    const requestData = {
      partnerId: partnerId,
      message: 'Hi, I would like to study together!',
      senderEmail: 'student@test.com',
      senderName: 'Test Student'
    };

    const requestResponse = await axios.post(`${BASE_URL}/requests`, requestData);
    console.log('Request sent:', requestResponse.data);

    // Test 3: Get requests for the user
    console.log('\n3. Fetching user requests...');
    const userRequests = await axios.get(`${BASE_URL}/requests/student@test.com`);
    console.log('User requests:', userRequests.data);

    console.log('\n✅ All tests passed! The API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRequests();
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  console.log('🧪 Testing Study Partner API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthCheck = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', healthCheck.data.message);

    // Test 2: Get all partners
    console.log('\n2. Testing GET /partners...');
    const partnersResponse = await axios.get(`${BASE_URL}/partners`);
    console.log(`✅ Found ${partnersResponse.data.length} partners`);

    // Test 3: Create a test partner
    console.log('\n3. Testing POST /partners...');
    const testPartner = {
      name: 'Test Partner',
      email: 'test@example.com',
      subject: 'Mathematics',
      experienceLevel: 'Intermediate',
      studyMode: 'Online',
      availabilityTime: 'Evening 6-9 PM',
      location: 'Dhaka, Bangladesh',
      profileimage: 'https://ui-avatars.com/api/?name=Test+Partner&background=4f46e5&color=fff&size=150'
    };

    const createResponse = await axios.post(`${BASE_URL}/partners`, testPartner);
    console.log('✅ Partner created with ID:', createResponse.data._id);
    const partnerId = createResponse.data._id;

    // Test 4: Send a partner request
    console.log('\n4. Testing POST /requests...');
    const testRequest = {
      partnerId: partnerId,
      senderEmail: 'sender@example.com',
      senderName: 'Test Sender',
      message: 'I would like to study with you!'
    };

    const requestResponse = await axios.post(`${BASE_URL}/requests`, testRequest);
    console.log('✅ Request created with ID:', requestResponse.data._id);

    // Test 5: Get requests by email
    console.log('\n5. Testing GET /requests/:email...');
    const requestsResponse = await axios.get(`${BASE_URL}/requests/sender@example.com`);
    console.log(`✅ Found ${requestsResponse.data.length} requests for sender@example.com`);

    console.log('\n🎉 All tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
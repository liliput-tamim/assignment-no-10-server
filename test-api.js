// Simple API test file
// Run this after starting the server to test basic endpoints

const testAPI = async () => {
  const baseURL = 'http://localhost:4000';
  
  try {
    // Test basic endpoint
    const response = await fetch(baseURL);
    const data = await response.json();
    console.log('✅ Server Status:', data);
    
    // Test partners endpoint
    const partnersResponse = await fetch(`${baseURL}/partners`);
    const partners = await partnersResponse.json();
    console.log('✅ Partners endpoint working, found:', partners.length, 'partners');
    
    // Test top-rated partners
    const topRatedResponse = await fetch(`${baseURL}/partners/top-rated`);
    const topRated = await topRatedResponse.json();
    console.log('✅ Top-rated partners endpoint working, found:', topRated.length, 'partners');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
};

// Uncomment to run tests
// testAPI();
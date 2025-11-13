const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const uri = "mongodb+srv://assingment-user:l1zqLQ2UrHWUTHbv@tamim5.kdnsuo2.mongodb.net/?appName=tamim5";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Partner Backend API - Working!' });
});

// Get all partners
app.get('/partners', async (req, res) => {
  try {
    console.log('Fetching all partners...');
    const partners = await db.collection('partners').find({}).toArray();
    console.log(`Found ${partners.length} partners`);
    res.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single partner
app.get('/partners/:id', async (req, res) => {
  try {
    console.log('Fetching partner:', req.params.id);
    const partner = await db.collection('partners').findOne({ _id: new ObjectId(req.params.id) });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json(partner);
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create partner profile
app.post('/partners', async (req, res) => {
  try {
    console.log('Creating partner profile:', req.body);
    const partnerData = {
      ...req.body,
      createdAt: new Date(),
      partnerCount: 0,
      rating: 4.5
    };
    
    const result = await db.collection('partners').insertOne(partnerData);
    console.log('Partner created with ID:', result.insertedId);
    res.status(201).json({ _id: result.insertedId, ...partnerData });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send partner request
app.post('/requests', async (req, res) => {
  try {
    console.log('Creating request:', req.body);
    const { partnerId, message, senderEmail, senderName } = req.body;
    
    // Check for duplicate request
    const existingRequest = await db.collection('requests').findOne({
      senderEmail: senderEmail,
      partnerId: partnerId
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent to this partner' });
    }
    
    const requestData = {
      senderEmail: senderEmail,
      senderName: senderName,
      partnerId: partnerId,
      message: message || '',
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await db.collection('requests').insertOne(requestData);
    console.log('Request created with ID:', result.insertedId);
    
    res.status(201).json({ _id: result.insertedId, ...requestData });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to get all requests
app.get('/requests/all', async (req, res) => {
  try {
    console.log('🔍 Fetching all requests for debugging...');
    const requests = await db.collection('requests').find({}).toArray();
    console.log(`📊 Found ${requests.length} total requests in database`);
    res.json(requests);
  } catch (error) {
    console.error('❌ Error fetching all requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get requests by user email
app.get('/requests/:email', async (req, res) => {
  try {
    console.log('Fetching requests for email:', req.params.email);
    
    const requests = await db.collection('requests')
      .find({ senderEmail: req.params.email })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Found ${requests.length} requests`);
    
    // Populate partner details
    for (let request of requests) {
      try {
        const partner = await db.collection('partners').findOne({ _id: new ObjectId(request.partnerId) });
        request.partnerDetails = partner;
      } catch (err) {
        console.error('Error fetching partner details:', err);
        request.partnerDetails = null;
      }
    }
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update partner request
app.put('/requests/:id', async (req, res) => {
  try {
    console.log('Updating request:', req.params.id, req.body);
    await db.collection('requests').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete partner request
app.delete('/requests/:id', async (req, res) => {
  try {
    console.log('Deleting request:', req.params.id);
    await db.collection('requests').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await client.connect();
    db = client.db('studyPartnerDB');
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
    
    app.listen(port, () => {
      console.log(`🚀 Study Partner API listening on port ${port}`);
      console.log(`📍 API URL: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();
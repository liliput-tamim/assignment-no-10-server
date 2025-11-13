require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin initialization
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.log('Firebase Admin SDK not configured, using basic auth');
  }
}

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

// Firebase Auth Middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // For development - skip token verification if Firebase Admin is not configured
    if (!admin.apps.length) {
      req.user = { email: 'test@example.com', name: 'Test User' };
      return next();
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    // For development - allow requests to pass through
    req.user = { email: 'test@example.com', name: 'Test User' };
    next();
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Partner Backend API' });
});

// Auth verification endpoint
app.post('/auth/verify', verifyToken, (req, res) => {
  res.json({ message: 'Token verified', user: req.user });
});

// Get all partners with search and sort
app.get('/partners', async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = {};
    
    if (search) {
      query.subject = { $regex: search, $options: 'i' };
    }
    
    let sortOption = {};
    if (sort === 'expert') {
      sortOption.experienceLevel = -1;
    } else if (sort === 'rating') {
      sortOption.rating = -1;
    }
    
    const partners = await db.collection('partners').find(query).sort(sortOption).toArray();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top-rated partners (must come before /:id route)
app.get('/partners/top-rated', async (req, res) => {
  try {
    const partners = await db.collection('partners')
      .find({})
      .sort({ rating: -1, partnerCount: -1 })
      .limit(6)
      .toArray();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single partner
app.get('/partners/:id', async (req, res) => {
  try {
    const partner = await db.collection('partners').findOne({ _id: new ObjectId(req.params.id) });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new partner profile
app.post('/partners', verifyToken, async (req, res) => {
  try {
    const partnerData = {
      ...req.body,
      createdBy: req.user.email,
      createdAt: new Date(),
      partnerCount: 0,
      rating: 0
    };
    
    const result = await db.collection('partners').insertOne(partnerData);
    res.status(201).json({ _id: result.insertedId, ...partnerData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update partner profile
app.put('/partners/:id', verifyToken, async (req, res) => {
  try {
    const partner = await db.collection('partners').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    if (partner.createdBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }
    
    await db.collection('partners').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    
    res.json({ message: 'Partner updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete partner profile
app.delete('/partners/:id', verifyToken, async (req, res) => {
  try {
    const partner = await db.collection('partners').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    if (partner.createdBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this profile' });
    }
    
    await db.collection('partners').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send partner request
app.post('/requests', verifyToken, async (req, res) => {
  try {
    const { partnerId, message } = req.body;
    
    // Check for duplicate request
    const existingRequest = await db.collection('requests').findOne({
      senderEmail: req.user.email,
      partnerId: partnerId
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent to this partner' });
    }
    
    const requestData = {
      senderEmail: req.user.email,
      senderName: req.user.name,
      partnerId: partnerId,
      message: message || '',
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await db.collection('requests').insertOne(requestData);
    
    // Increment partner count
    await db.collection('partners').updateOne(
      { _id: new ObjectId(partnerId) },
      { $inc: { partnerCount: 1 } }
    );
    
    res.status(201).json({ _id: result.insertedId, ...requestData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get requests by user email
app.get('/requests/:email', verifyToken, async (req, res) => {
  try {
    if (req.params.email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to view these requests' });
    }
    
    const requests = await db.collection('requests')
      .find({ senderEmail: req.params.email })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Populate partner details
    for (let request of requests) {
      const partner = await db.collection('partners').findOne({ _id: new ObjectId(request.partnerId) });
      request.partnerDetails = partner;
    }
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update partner request
app.put('/requests/:id', verifyToken, async (req, res) => {
  try {
    const request = await db.collection('requests').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.senderEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    await db.collection('requests').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete partner request
app.delete('/requests/:id', verifyToken, async (req, res) => {
  try {
    const request = await db.collection('requests').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.senderEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }
    
    await db.collection('requests').deleteOne({ _id: new ObjectId(req.params.id) });
    
    // Decrement partner count
    await db.collection('partners').updateOne(
      { _id: new ObjectId(request.partnerId) },
      { $inc: { partnerCount: -1 } }
    );
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/profile/:email', verifyToken, async (req, res) => {
  try {
    if (req.params.email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }
    
    let user = await db.collection('users').findOne({ email: req.params.email });
    
    if (!user) {
      user = {
        email: req.user.email,
        name: req.user.name,
        photoURL: req.user.picture,
        createdAt: new Date()
      };
      await db.collection('users').insertOne(user);
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message });
});

// Initialize database and start server
async function startServer() {
  try {
    await client.connect();
    db = client.db('studyPartnerDB');
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
    
    app.listen(port, () => {
      console.log(`Study Partner API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
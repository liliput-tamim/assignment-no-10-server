require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { verifyToken } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI || "mongodb+srv://assingment-user:l1zqLQ2UrHWUTHbv@tamim5.kdnsuo2.mongodb.net/?appName=tamim5";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Partner Backend API', status: 'Running' });
});

// Auth verification endpoint
app.post('/auth/verify', verifyToken, (req, res) => {
  res.json({ message: 'Token verified', user: req.user });
});

// User profile endpoint
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
    
    // Load routes after DB connection
    const partnersRoutes = require('./routes/partners')(db);
    const requestsRoutes = require('./routes/requests')(db);
    
    app.use('/partners', partnersRoutes);
    app.use('/requests', requestsRoutes);
    
    app.listen(port, () => {
      console.log(`Study Partner API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
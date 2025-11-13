const express = require('express');
const { ObjectId } = require('mongodb');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

module.exports = (db) => {
  // Send partner request
  router.post('/', verifyToken, async (req, res) => {
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
  router.get('/:email', verifyToken, async (req, res) => {
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
  router.put('/:id', verifyToken, async (req, res) => {
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
  router.delete('/:id', verifyToken, async (req, res) => {
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

  return router;
};
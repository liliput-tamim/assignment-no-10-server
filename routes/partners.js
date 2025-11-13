const express = require('express');
const { ObjectId } = require('mongodb');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

module.exports = (db) => {
  // Get all partners with search and sort
  router.get('/', async (req, res) => {
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

  // Get top-rated partners
  router.get('/top-rated', async (req, res) => {
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
  router.get('/:id', async (req, res) => {
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
  router.post('/', verifyToken, async (req, res) => {
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
  router.put('/:id', verifyToken, async (req, res) => {
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
  router.delete('/:id', verifyToken, async (req, res) => {
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

  return router;
};
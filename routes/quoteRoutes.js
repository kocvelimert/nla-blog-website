const express = require('express');
const router = express.Router();
const quoteService = require('../services/quoteService');

// Get daily quote
router.get('/daily', async (req, res) => {
  try {
    const quote = await quoteService.getDailyQuote();
    
    res.json({
      status: 'success',
      data: quote
    });
  } catch (error) {
    console.error('Error getting daily quote:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get daily quote'
    });
  }
});

// Force refresh quote (for admin/testing)
router.post('/refresh', async (req, res) => {
  try {
    const quote = await quoteService.forceRefresh();
    
    res.json({
      status: 'success',
      data: quote,
      message: 'Quote refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing quote:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh quote'
    });
  }
});

// Check if quote needs update (for debugging)
router.get('/status', async (req, res) => {
  try {
    const needsUpdate = await quoteService.needsUpdate();
    const storedData = await quoteService.getStoredQuote();
    
    res.json({
      status: 'success',
      data: {
        needsUpdate,
        lastUpdated: storedData.lastUpdated,
        hoursUntilNextUpdate: needsUpdate ? 0 : Math.max(0, 24 - ((new Date() - new Date(storedData.lastUpdated)) / (1000 * 60 * 60)))
      }
    });
  } catch (error) {
    console.error('Error getting quote status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quote status'
    });
  }
});

module.exports = router; 
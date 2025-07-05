const express = require('express');
const newsletterController = require('../controllers/newsletterController');

const router = express.Router();

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe a user to the newsletter
 * @access  Public
 * @body    { name: string, email: string }
 */
router.post('/subscribe', newsletterController.subscribe);

/**
 * @route   POST /api/newsletter/campaign
 * @desc    Create and send a newsletter campaign for a blog post
 * @access  Private (should be protected in production)
 * @body    { title: string, slug: string, excerpt?: string, thumbnail?: string, publishDate?: Date }
 */
router.post('/campaign', newsletterController.sendCampaign);

/**
 * @route   GET /api/newsletter/stats
 * @desc    Get newsletter subscription statistics
 * @access  Private (should be protected in production)
 */
router.get('/stats', newsletterController.getStats);

/**
 * @route   GET /api/newsletter/test
 * @desc    Test newsletter service connection
 * @access  Private (should be protected in production)
 */
router.get('/test', newsletterController.testConnection);

module.exports = router; 
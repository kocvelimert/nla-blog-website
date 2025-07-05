const newsletterService = require('../services/newsletterService');

class NewsletterController {
    /**
     * Subscribe a user to the newsletter
     * POST /api/newsletter/subscribe
     */
    async subscribe(req, res) {
        try {
            const { name, email } = req.body;

            // Input validation
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Ad ve e-posta adresi gereklidir.'
                });
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçerli bir e-posta adresi girin.'
                });
            }

            // Name validation (minimum 2 characters)
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Ad en az 2 karakter olmalıdır.'
                });
            }

            // Subscribe user via newsletter service
            const result = await newsletterService.subscribeUser(email.toLowerCase().trim(), name.trim());

            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('❌ Newsletter subscription controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Send newsletter campaign for a new blog post
     * POST /api/newsletter/campaign
     */
    async sendCampaign(req, res) {
        try {
            const postData = req.body;

            // Validate required fields
            if (!postData.title || !postData.slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Post title and slug are required.'
                });
            }

            // Send campaign via newsletter service
            const result = await newsletterService.createPostNotificationCampaign(postData);

            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('❌ Newsletter campaign controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Campaign creation failed.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Get newsletter subscription statistics
     * GET /api/newsletter/stats
     */
    async getStats(req, res) {
        try {
            const result = await newsletterService.getSubscriptionStats();

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('❌ Newsletter stats controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch newsletter statistics.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Test newsletter service connection
     * GET /api/newsletter/test
     */
    async testConnection(req, res) {
        try {
            // Test if Brevo API credentials are working
            const result = await newsletterService.getSubscriptionStats();
            
            return res.status(200).json({
                success: true,
                message: 'Newsletter service connection is working!',
                apiStatus: result.success ? 'Connected' : 'Error',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Newsletter connection test error:', error);
            return res.status(500).json({
                success: false,
                message: 'Newsletter service connection failed.',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new NewsletterController(); 
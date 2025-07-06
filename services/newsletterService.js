const SibApiV3Sdk = require('sib-api-v3-sdk');
const { config } = require('../config/environment');

class NewsletterService {
    constructor() {
        console.log('🔧 Initializing NewsletterService...');
        
        // Validate configuration
        if (!config.BREVO.API_KEY) {
            throw new Error('BREVO_SUBSCRIBE_API is required but not configured');
        }
        
        if (!config.BREVO.LIST_ID) {
            throw new Error('BREVO_LIST_ID is required but not configured');
        }
        
        if (!config.BREVO.SENDER_EMAIL) {
            throw new Error('BREVO_SENDER_EMAIL is required but not configured');
        }
        
        // Set up Brevo client
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = config.BREVO.API_KEY;
        
        this.contactsApi = new SibApiV3Sdk.ContactsApi();
        this.emailCampaignsApi = new SibApiV3Sdk.EmailCampaignsApi();
        this.listId = parseInt(config.BREVO.LIST_ID);
        this.senderEmail = config.BREVO.SENDER_EMAIL;
        this.baseUrl = config.BASE_URL;
        
        console.log('✅ NewsletterService initialized successfully');
    }

    /**
     * Subscribe a user to the newsletter
     * @param {string} email - User's email address
     * @param {string} firstName - User's first name
     * @returns {Promise} Brevo API response
     */
    async subscribeUser(email, firstName) {
        try {
            const createContact = new SibApiV3Sdk.CreateContact();
            
            createContact.email = email;
            createContact.attributes = {
                FIRSTNAME: firstName
            };
            createContact.listIds = [this.listId];
            createContact.updateEnabled = true;

            const response = await this.contactsApi.createContact(createContact);
            
            console.log(`✅ User subscribed successfully: ${email}`);
            return {
                success: true,
                data: response,
                message: 'Başarıyla abone oldunuz!'
            };

        } catch (error) {
            console.error('❌ Newsletter subscription error:', error);
            
            // Handle different types of errors
            if (error.status === 400 && error.response?.body?.message?.includes('Contact already exist')) {
                return {
                    success: true,
                    message: 'Bu e-posta adresi zaten abone listesinde!'
                };
            }
            
            return {
                success: false,
                message: 'Abonelik sırasında bir hata oluştu. Lütfen tekrar deneyin.',
                error: error.message
            };
        }
    }

    /**
     * Create and send a blog post notification campaign
     * @param {Object} postData - Blog post data
     * @returns {Promise} Campaign creation response
     */
    async createPostNotificationCampaign(postData) {
        try {
            const { title, slug, excerpt, thumbnail, publishDate } = postData;
            
            console.log('📧 Creating newsletter campaign for:', {
                title,
                slug,
                hasExcerpt: !!excerpt,
                hasThumbnail: !!thumbnail,
                publishDate: publishDate ? new Date(publishDate).toISOString() : null
            });
            
            // Validate required fields
            if (!title || !slug) {
                throw new Error('Title and slug are required for newsletter campaign');
            }
            
            // Create campaign
            const createCampaign = new SibApiV3Sdk.CreateEmailCampaign();
            
            createCampaign.name = `Blog Post: ${title}`;
            createCampaign.subject = `Yeni Blog Yazısı: ${title}`;
            
            // Sender info
            createCampaign.sender = {
                name: 'No Life Anime',
                email: this.senderEmail || 'noreply@nolifeanime.com'
            };
            
            // HTML content
            const htmlContent = this.generatePostEmailTemplate(postData);
            createCampaign.htmlContent = htmlContent;
            
            console.log('📧 Generated email HTML content length:', htmlContent.length);
            
            // Recipients
            createCampaign.recipients = {
                listIds: [this.listId]
            };
            
            console.log('📧 Campaign configuration:', {
                name: createCampaign.name,
                subject: createCampaign.subject,
                sender: createCampaign.sender,
                listId: this.listId,
                htmlContentLength: htmlContent.length
            });
            
            // Create the campaign
            const campaignResponse = await this.emailCampaignsApi.createEmailCampaign(createCampaign);
            
            console.log(`✅ Campaign created successfully: ${campaignResponse.id}`);
            
            // Send the campaign immediately
            const sendResponse = await this.emailCampaignsApi.sendEmailCampaignNow(campaignResponse.id);
            
            console.log(`✅ Campaign sent successfully: ${campaignResponse.id}`);
            
            return {
                success: true,
                campaignId: campaignResponse.id,
                message: 'E-posta kampanyası başarıyla gönderildi!',
                data: {
                    campaignId: campaignResponse.id,
                    postTitle: title,
                    postSlug: slug,
                    sentAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('❌ Campaign creation error:', error);
            
            // Log detailed error information
            if (error.response) {
                console.error('❌ API Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    body: error.response.body
                });
            }
            
            return {
                success: false,
                message: 'E-posta kampanyası oluşturulurken hata oluştu.',
                error: error.message,
                details: error.response ? {
                    status: error.response.status,
                    message: error.response.body?.message || error.response.statusText
                } : null
            };
        }
    }

    /**
     * Generate HTML email template for blog post notification
     * @param {Object} postData - Blog post data
     * @returns {string} HTML email content
     */
    generatePostEmailTemplate(postData) {
        const { title, slug, excerpt, thumbnail, publishDate } = postData;
        const baseUrl = this.baseUrl || 'http://localhost:3000';
        const postUrl = `${baseUrl}/post.html?slug=${slug}`;
        
        // Format publish date
        const formattedDate = publishDate ? 
            new Date(publishDate).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 
            new Date().toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        
        // Extract first paragraph from excerpt for compact view
        const emailExcerpt = excerpt || `${title} hakkında yeni yazımızı okumak için tıklayın!`;
        
        // Split excerpt into paragraphs and get first one
        const firstParagraph = emailExcerpt.split('\n')[0] || emailExcerpt.substring(0, 150) + '...';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Yeni Blog Yazısı: ${title}</title>
            <style>
                /* Website-matching styles */
                @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
                
                body {
                    font-family: 'Rubik', sans-serif;
                    line-height: 1.7;
                    color: #151516;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0;
                    background-color: #f8f9fa;
                    font-size: 16px;
                }
                
                .email-container {
                    background: white;
                    border-radius: 0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                    border-top: 3px solid #097bed;
                }
                
                /* Header - website-like navbar */
                .header {
                    background: #fff;
                    border-bottom: 1px solid #eee;
                    padding: 20px 30px;
                    text-align: center;
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: 700;
                    color: #097bed;
                    margin: 0;
                    text-decoration: none;
                }
                
                .tagline {
                    font-size: 14px;
                    color: #666;
                    margin: 5px 0 0 0;
                    font-weight: 400;
                }
                
                /* Main content - website-like post card */
                .content {
                    padding: 30px;
                    background: white;
                }
                
                .post-meta {
                    margin-bottom: 15px;
                    font-size: 14px;
                    color: #666;
                }
                
                .post-meta .date {
                    color: #097bed;
                    font-weight: 500;
                }
                
                .post-title {
                    font-size: 28px;
                    font-weight: 600;
                    color: #201654;
                    margin: 0 0 20px 0;
                    line-height: 1.3;
                    font-family: 'Rubik', sans-serif;
                }
                
                .post-image {
                    width: 100%;
                    max-width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin: 0 0 20px 0;
                    border: 1px solid #eee;
                }
                
                .post-excerpt {
                    font-size: 16px;
                    color: #151516;
                    margin: 0 0 25px 0;
                    line-height: 1.7;
                    font-family: 'Rubik', sans-serif;
                }
                
                /* Website-matching button */
                .btn {
                    display: inline-block;
                    background: #097bed;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: 500;
                    font-size: 16px;
                    font-family: 'Rubik', sans-serif;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                
                .btn:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    transition: left 0.5s;
                }
                
                .btn:hover {
                    background: #0056b3;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(9, 123, 237, 0.3);
                }
                
                .btn:hover:before {
                    left: 100%;
                }
                
                /* Newsletter signature - compact */
                .newsletter-info {
                    background: #f8f9fa;
                    padding: 20px 30px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    font-size: 14px;
                    color: #666;
                }
                
                .newsletter-info .brand {
                    color: #097bed;
                    font-weight: 600;
                    text-decoration: none;
                }
                
                .newsletter-info .brand:hover {
                    color: #0056b3;
                }
                
                /* Footer - minimal */
                .footer {
                    background: #201654;
                    color: #fff;
                    padding: 20px 30px;
                    text-align: center;
                    font-size: 12px;
                }
                
                .footer a {
                    color: #097bed;
                    text-decoration: none;
                }
                
                .footer a:hover {
                    text-decoration: underline;
                }
                
                .footer p {
                    margin: 5px 0;
                }
                
                /* Mobile responsive */
                @media (max-width: 600px) {
                    body {
                        padding: 0;
                    }
                    
                    .header {
                        padding: 15px 20px;
                    }
                    
                    .logo {
                        font-size: 20px;
                    }
                    
                    .content {
                        padding: 20px;
                    }
                    
                    .post-title {
                        font-size: 24px;
                    }
                    
                    .post-image {
                        height: 180px;
                    }
                    
                    .newsletter-info {
                        padding: 15px 20px;
                    }
                    
                    .footer {
                        padding: 15px 20px;
                    }
                }
                
                /* Prevent email client issues */
                table {
                    border-collapse: collapse;
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }
                
                img {
                    border: 0;
                    height: auto;
                    line-height: 100%;
                    outline: none;
                    text-decoration: none;
                    -ms-interpolation-mode: bicubic;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Header - Website-like navbar -->
                <div class="header">
                    <h1 class="logo">No Life Anime</h1>
                    <p class="tagline">Anime, Manga ve Manhwa Dünyasından Haberler</p>
                </div>
                
                <!-- Main content - Website-like post card -->
                <div class="content">
                    <div class="post-meta">
                        <span class="date">${formattedDate}</span>
                    </div>
                    
                    <h2 class="post-title">${title}</h2>
                    
                    ${thumbnail ? `<img src="${thumbnail}" alt="${title}" class="post-image">` : ''}
                    
                    <div class="post-excerpt">${firstParagraph}</div>
                    
                    <a href="${postUrl}" class="btn">Tüm İçeriği Görüntüle</a>
                </div>
                
                <!-- Newsletter info - compact -->
                <div class="newsletter-info">
                    <p>Bu e-postayı <a href="${baseUrl}" class="brand">No Life Anime</a> haber bültenine abone olduğunuz için aldınız.</p>
                    <p>Yeni içeriklerimizden haberdar olmak için <a href="${baseUrl}" class="brand">sitemizi ziyaret edin</a>.</p>
                </div>
                
                <!-- Footer - minimal -->
                <div class="footer">
                    <p>Abonelikten çıkmak için <a href="{{unsubscribe}}">buraya tıklayın</a></p>
                    <p>© ${new Date().getFullYear()} No Life Anime</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Get newsletter subscription statistics
     * @returns {Promise} Statistics data
     */
    async getSubscriptionStats() {
        try {
            const listInfo = await this.contactsApi.getList(this.listId);
            
            return {
                success: true,
                totalSubscribers: listInfo.totalSubscribers,
                totalBlacklisted: listInfo.totalBlacklisted,
                uniqueSubscribers: listInfo.uniqueSubscribers
            };
        } catch (error) {
            console.error('❌ Error fetching subscription stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new NewsletterService(); 
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
            const { title, slug, excerpt, thumbnail, publishDate, category, formatCategory, contentCategory, author } = postData;
            
            console.log('📧 Creating newsletter campaign for:', {
                title,
                slug,
                category,
                formatCategory,
                contentCategory,
                author,
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
            
            // Helper function to capitalize first letter only
            const capitalizeFirst = (str) => {
                return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
            };
            
            // Format subject line: Yeni [Formatcategory] - [Contentcategory] İçeriği: [title]
            const subjectLine = formatCategory && contentCategory ? 
                `Yeni ${capitalizeFirst(formatCategory)} - ${capitalizeFirst(contentCategory)} İçeriği: ${title}` : 
                `Yeni Blog Yazısı: ${title}`;
            
            createCampaign.name = `Blog Post: ${title}`;
            createCampaign.subject = subjectLine;
            
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
        const { title, slug, excerpt, thumbnail, publishDate, category, formatCategory, contentCategory, author } = postData;
        const baseUrl = this.baseUrl || 'http://localhost:3000';
        const postUrl = `${baseUrl}/post.html?slug=${slug}`;
        
        // Use Cloudinary transformations for optimized logo
        const logoUrl = 'https://res.cloudinary.com/dpwktwbzk/image/upload/w_300,h_60,c_fit,q_auto,f_auto/v1751794543/245b11d0-bd60-45c0-92b0-0a808a7dbab2.png';
        
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
        const firstParagraph = emailExcerpt.split('\n')[0] || emailExcerpt.substring(0, 200) + '...';
        
        return `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>${title}</title>
            <style>
                /* Website-matching styles */
                @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
                
                body {
                    font-family: 'Rubik', sans-serif;
                    line-height: 1.7;
                    color: #151516;
                    margin: 0;
                    padding: 30px 15px;
                    background-color: #f0f2f5;
                    font-size: 18px;
                }
                
                /* Card container */
                .email-card {
                    max-width: 650px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    overflow: hidden;
                    border: 1px solid #e0e0e0;
                }
                
                /* Blue header */
                .email-header {
                    background: linear-gradient(135deg, #097bed 0%, #0056b3 100%);
                    color: white;
                    padding: 25px 30px;
                    text-align: center;
                    position: relative;
                }
                
                .email-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="90" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="30" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.3;
                }
                
                .logo-container {
                    position: relative;
                    z-index: 1;
                    margin-bottom: 10px;
                }
                
                .logo-container img {
                    max-width: 300px;
                    width: auto;
                    height: auto;
                    max-height: 60px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                }
                
                .personal-message {
                    position: relative;
                    z-index: 1;
                    font-size: 16px;
                    margin: 0;
                    font-weight: 500;
                    opacity: 0.95;
                }
                
                /* Content area */
                .email-content {
                    padding: 40px;
                    background: white;
                }
                
                .post-meta {
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #666;
                    font-weight: 500;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .post-meta .date {
                    color: #097bed;
                    font-weight: 600;
                    background: #f0f8ff;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 13px;
                }
                
                .post-meta .author {
                    color: #666;
                    font-weight: 500;
                }
                
                .post-meta .author::before {
                    content: "•";
                    margin-right: 8px;
                    color: #ccc;
                }
                
                .post-title {
                    font-size: 32px;
                    font-weight: 600;
                    color: #201654;
                    margin: 0 0 25px 0;
                    line-height: 1.3;
                    font-family: 'Rubik', sans-serif;
                }
                
                .post-image {
                    width: 100%;
                    max-width: 100%;
                    height: 250px;
                    object-fit: cover;
                    border-radius: 10px;
                    margin: 0 0 25px 0;
                    border: 1px solid #e0e0e0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }
                
                .post-excerpt {
                    font-size: 18px;
                    color: #151516;
                    margin: 0 0 30px 0;
                    line-height: 1.7;
                    font-family: 'Rubik', sans-serif;
                }
                
                /* Button - always white text */
                .btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #097bed 0%, #0056b3 100%);
                    color: white !important;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    font-family: 'Rubik', sans-serif;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(9, 123, 237, 0.3);
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
                    background: linear-gradient(135deg, #0056b3 0%, #004494 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(9, 123, 237, 0.4);
                    color: white !important;
                }
                
                .btn:hover:before {
                    left: 100%;
                }
                
                .btn:visited, .btn:active, .btn:focus {
                    color: white !important;
                }
                
                /* Blue footer - same gradient as header */
                .email-footer {
                    background: linear-gradient(135deg, #097bed 0%, #0056b3 100%);
                    color: white;
                    padding: 25px 30px;
                    text-align: center;
                    font-size: 14px;
                    position: relative;
                }
                
                .email-footer::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="90" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="30" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.3;
                }
                
                .email-footer p {
                    position: relative;
                    z-index: 1;
                    margin: 8px 0;
                    opacity: 0.95;
                }
                
                .email-footer a {
                    color: white !important;
                    text-decoration: none;
                    font-weight: 500;
                    opacity: 0.9;
                }
                
                .email-footer a:hover {
                    color: white !important;
                    text-decoration: underline;
                    opacity: 1;
                }
                
                /* Mobile responsive */
                @media (max-width: 650px) {
                    body {
                        padding: 15px 10px;
                    }
                    
                    .email-header {
                        padding: 20px 20px;
                    }
                    
                    .logo-container img {
                        max-width: 250px;
                        max-height: 50px;
                    }
                    
                    .email-content {
                        padding: 25px 20px;
                    }
                    
                    .post-title {
                        font-size: 26px;
                    }
                    
                    .post-excerpt {
                        font-size: 16px;
                    }
                    
                    .post-image {
                        height: 200px;
                    }
                    
                    .btn {
                        padding: 14px 28px;
                        font-size: 15px;
                    }
                    
                    .email-footer {
                        padding: 20px 20px;
                    }
                    
                    .post-meta {
                        font-size: 13px;
                        gap: 10px;
                    }
                    
                    .post-meta .date,
                    .post-meta .author {
                        font-size: 12px;
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
                
                /* Outlook specific */
                .ReadMsgBody { width: 100%; }
                .ExternalClass { width: 100%; }
                .ExternalClass * { line-height: 100%; }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .btn {
                        color: white !important;
                    }
                    .btn:hover {
                        color: white !important;
                    }
                    .btn:visited, .btn:active, .btn:focus {
                        color: white !important;
                    }
                }
                
                /* Force white text on button for all email clients */
                .btn[style*="color"] {
                    color: white !important;
                }
            </style>
        </head>
        <body>
            <div class="email-card">
                <!-- Blue header -->
                <div class="email-header">
                    <div class="logo-container">
                        <img src="${logoUrl}" alt="No Life Anime" />
                    </div>
                    <p class="personal-message">Merhaba! Yeni bir içerik yayınladık ve ilk sen görüyorsun. Kaçırma! 🎌</p>
                </div>
                
                <!-- Content area -->
                <div class="email-content">
                    <div class="post-meta">
                        <span class="date">${formattedDate}</span>
                        <span class="date">${author}</span>
                    </div>
                    
                    <h1 class="post-title">${title}</h1>
                    
                    ${thumbnail ? `<img src="${thumbnail}" alt="${title}" class="post-image">` : ''}
                    
                    <div class="post-excerpt">${firstParagraph}</div>
                    
                    <a href="${postUrl}" class="btn" style="color: white !important;">Tüm İçeriği Görüntüle</a>
                </div>
                
                <!-- Blue footer - same gradient as header -->
                <div class="email-footer">
                    <p>Bu özel içeriği <strong>No Life Anime</strong> ailesinin bir parçası olduğun için gönderiyoruz.</p>
                    <p><a href="{{unsubscribe}}">Abonelikten çık</a> • <a href="${baseUrl}">Sitemizi ziyaret et</a></p>
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
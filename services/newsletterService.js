const SibApiV3Sdk = require('sib-api-v3-sdk');

class NewsletterService {
    constructor() {
        // Set up Brevo client
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_SUBSCRIBE_API;

        this.contactsApi = new SibApiV3Sdk.ContactsApi();
        this.emailCampaignsApi = new SibApiV3Sdk.EmailCampaignsApi();
        this.listId = parseInt(process.env.BREVO_LIST_ID);
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
            
            // Create campaign
            const createCampaign = new SibApiV3Sdk.CreateEmailCampaign();
            
            createCampaign.name = `Blog Post: ${title}`;
            createCampaign.subject = `Yeni Blog Yazısı: ${title}`;
            
            // Sender info
            createCampaign.sender = {
                name: 'No Life Anime',
                email: process.env.BREVO_SENDER_EMAIL || 'noreply@nolifeanime.com'
            };
            
            // HTML content
            const htmlContent = this.generatePostEmailTemplate(postData);
            createCampaign.htmlContent = htmlContent;
            
            // Recipients
            createCampaign.recipients = {
                listIds: [this.listId]
            };
            
            // Create the campaign
            const campaignResponse = await this.emailCampaignsApi.createEmailCampaign(createCampaign);
            
            console.log(`✅ Campaign created successfully: ${campaignResponse.id}`);
            
            // Send the campaign immediately
            const sendResponse = await this.emailCampaignsApi.sendEmailCampaignNow(campaignResponse.id);
            
            console.log(`✅ Campaign sent successfully: ${campaignResponse.id}`);
            
            return {
                success: true,
                campaignId: campaignResponse.id,
                message: 'E-posta kampanyası başarıyla gönderildi!'
            };

        } catch (error) {
            console.error('❌ Campaign creation error:', error);
            return {
                success: false,
                message: 'E-posta kampanyası oluşturulurken hata oluştu.',
                error: error.message
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
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const postUrl = `${baseUrl}/post.html?slug=${slug}`;
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Yeni Blog Yazısı: ${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: #097bed;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .post-image {
                    width: 100%;
                    max-width: 500px;
                    height: auto;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .btn {
                    background: #097bed;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>No Life Anime</h1>
                <p>Yeni blog yazımız yayında!</p>
            </div>
            
            <div class="content">
                <h2>${title}</h2>
                
                ${thumbnail ? `<img src="${thumbnail}" alt="${title}" class="post-image">` : ''}
                
                <p>${excerpt || 'Yeni blog yazımızı okumak için tıklayın!'}</p>
                
                <a href="${postUrl}" class="btn">Yazıyı Oku</a>
                
                <p style="margin-top: 30px;">
                    <small>Yayın Tarihi: ${new Date(publishDate).toLocaleDateString('tr-TR')}</small>
                </p>
            </div>
            
            <div class="footer">
                <p>Bu e-postayı No Life Anime haber bültenine abone olduğunuz için aldınız.</p>
                <p>Abonelikten çıkmak için <a href="{{unsubscribe}}">buraya tıklayın</a>.</p>
                <p>© ${new Date().getFullYear()} No Life Anime. Tüm hakları saklıdır.</p>
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
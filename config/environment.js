const path = require('path');
const fs = require('fs');

// Try to load dotenv with explicit path
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (error) {
    console.error('Error loading .env file:', error.message);
}

// Configuration object with validation
const config = {
    // Server configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Brevo configuration
    BREVO: {
        API_KEY: process.env.BREVO_SUBSCRIBE_API,
        LIST_ID: process.env.BREVO_LIST_ID,
        SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL
    },
    
    // Newsletter configuration
    NEWSLETTER: {
        LOGO_URL: process.env.NEWSLETTER_LOGO_URL || 'https://res.cloudinary.com/dpwktwbzk/image/upload/v1751794543/245b11d0-bd60-45c0-92b0-0a808a7dbab2.png'
    },
    
    // Database configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nla-local-server',
    
    // Cloudinary configuration
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET
    }
};

// Validation function
function validateConfig() {
    const errors = [];
    
    // Check required Brevo configuration
    if (!config.BREVO.API_KEY) {
        errors.push('BREVO_SUBSCRIBE_API is required');
    } else if (!config.BREVO.API_KEY.startsWith('xkeysib-')) {
        errors.push('BREVO_SUBSCRIBE_API must start with "xkeysib-"');
    }
    
    if (!config.BREVO.LIST_ID) {
        errors.push('BREVO_LIST_ID is required');
    } else if (isNaN(parseInt(config.BREVO.LIST_ID))) {
        errors.push('BREVO_LIST_ID must be a valid number');
    }
    
    if (!config.BREVO.SENDER_EMAIL) {
        errors.push('BREVO_SENDER_EMAIL is required');
    } else if (!config.BREVO.SENDER_EMAIL.includes('@')) {
        errors.push('BREVO_SENDER_EMAIL must be a valid email address');
    }
    
    return errors;
}

// Debug information
function logConfigDebug() {
    console.log('🔧 Configuration Debug:');
    console.log('- Environment file path:', path.join(__dirname, '..', '.env'));
    console.log('- Environment file exists:', fs.existsSync(path.join(__dirname, '..', '.env')));
    console.log('- NODE_ENV:', config.NODE_ENV);
    console.log('- BASE_URL:', config.BASE_URL);
    console.log('- BREVO_API_KEY exists:', !!config.BREVO.API_KEY);
    console.log('- BREVO_API_KEY format:', config.BREVO.API_KEY ? config.BREVO.API_KEY.startsWith('xkeysib-') : false);
    console.log('- BREVO_LIST_ID:', config.BREVO.LIST_ID);
    console.log('- BREVO_SENDER_EMAIL:', config.BREVO.SENDER_EMAIL);
    
    // Validate configuration
    const errors = validateConfig();
    if (errors.length > 0) {
        console.log('❌ Configuration errors:');
        errors.forEach(error => console.log(`  - ${error}`));
    } else {
        console.log('✅ Configuration is valid');
    }
}

// Export configuration
module.exports = {
    config,
    validateConfig,
    logConfigDebug
}; 
/**
 * Newsletter Subscription Handler
 * Handles form submission for newsletter subscription
 */

class NewsletterManager {
    constructor() {
        this.apiBaseUrl = '/api/newsletter';
        this.isSubmitting = false;
        this.init();
    }

    /**
     * Initialize newsletter functionality
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }

        // Also bind events when components are loaded
        document.addEventListener('componentsLoaded', () => {
            setTimeout(() => this.bindEvents(), 100);
        });
    }

    /**
     * Bind events to newsletter forms
     */
    bindEvents() {
        // Find all newsletter forms on the page
        const newsletterForms = document.querySelectorAll('#newsletter-form');
        
        newsletterForms.forEach(form => {
            // Remove existing listeners to prevent duplicates
            form.removeEventListener('submit', this.handleSubmit.bind(this));
            // Add submit event listener
            form.addEventListener('submit', this.handleSubmit.bind(this));
        });

        console.log(`📮 Newsletter manager initialized for ${newsletterForms.length} form(s)`);
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (this.isSubmitting) {
            return;
        }

        const form = event.target;
        const nameInput = form.querySelector('#newsletter-name');
        const emailInput = form.querySelector('#newsletter-email');
        const submitButton = form.querySelector('button[type="submit"]');

        // Get form data
        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();

        // Basic validation
        if (!name || !email) {
            this.showMessage(form, 'Ad ve e-posta adresi gereklidir.', 'error');
            return;
        }

        // Email validation
        if (!this.isValidEmail(email)) {
            this.showMessage(form, 'Geçerli bir e-posta adresi girin.', 'error');
            emailInput.focus();
            return;
        }

        // Start submission
        this.isSubmitting = true;
        this.setButtonLoading(submitButton, true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(form, result.message, 'success');
                this.resetForm(form);
                
                // Track subscription (you can add analytics here)
                this.trackSubscription(name, email);
            } else {
                this.showMessage(form, result.message, 'error');
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showMessage(form, 'Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
        } finally {
            this.isSubmitting = false;
            this.setButtonLoading(submitButton, false);
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Is email valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show message to user
     * @param {HTMLElement} form - Form element
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(form, message, type = 'info') {
        // Remove existing messages
        const existingMessage = form.querySelector('.newsletter-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `newsletter-message newsletter-message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <i class="fa fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Insert message after form
        form.parentNode.insertBefore(messageElement, form.nextSibling);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);

        // Scroll to message if it's not visible
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Get icon for message type
     * @param {string} type - Message type
     * @returns {string} - FontAwesome icon class
     */
    getMessageIcon(type) {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            case 'info':
            default:
                return 'info-circle';
        }
    }

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Gönderiliyor...';
        } else {
            button.disabled = false;
            button.innerHTML = 'Abone Ol';
        }
    }

    /**
     * Reset form to initial state
     * @param {HTMLElement} form - Form element
     */
    resetForm(form) {
        const nameInput = form.querySelector('#newsletter-name');
        const emailInput = form.querySelector('#newsletter-email');

        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
    }

    /**
     * Track subscription for analytics
     * @param {string} name - User name
     * @param {string} email - User email
     */
    trackSubscription(name, email) {
        // You can add Google Analytics, Facebook Pixel, or other tracking here
        console.log('📧 Newsletter subscription tracked:', { name, email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
        
        // Example: Google Analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_subscription', {
                event_category: 'engagement',
                event_label: 'newsletter_signup'
            });
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/test`);
            const result = await response.json();
            console.log('Newsletter API test:', result);
            return result;
        } catch (error) {
            console.error('Newsletter API test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize newsletter manager
window.newsletterManager = new NewsletterManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsletterManager;
} 
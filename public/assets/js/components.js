/**
 * Component Loader for No Life Anime Website
 * Loads reusable components (navbar, sidebar, footer) dynamically
 */

class ComponentLoader {
    constructor() {
        this.componentsPath = 'components/';
        this.loadedComponents = new Map();
    }

    /**
     * Load a component from file
     */
    async loadComponent(componentName) {
        // Check if component is already loaded
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        try {
            const response = await fetch(`${this.componentsPath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }
            
            const html = await response.text();
            this.loadedComponents.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    /**
     * Insert component into target element
     */
    async insertComponent(componentName, targetSelector, insertMethod = 'innerHTML') {
        const html = await this.loadComponent(componentName);
        const target = document.querySelector(targetSelector);
        
        if (!html || !target) {
            console.warn(`Failed to insert component ${componentName} into ${targetSelector}`);
            return false;
        }

        switch (insertMethod) {
            case 'innerHTML':
                target.innerHTML = html;
                break;
            case 'beforeend':
                target.insertAdjacentHTML('beforeend', html);
                break;
            case 'afterbegin':
                target.insertAdjacentHTML('afterbegin', html);
                break;
            case 'replace':
                target.outerHTML = html;
                break;
            default:
                target.innerHTML = html;
        }

        return true;
    }

    /**
     * Load navbar component
     */
    async loadNavbar(targetSelector = 'header', insertMethod = 'innerHTML') {
        return await this.insertComponent('navbar-main', targetSelector, insertMethod);
    }

    /**
     * Load sidebar component
     */
    async loadSidebar(targetSelector = '.sidebar-container', insertMethod = 'innerHTML') {
        return await this.insertComponent('sidebar', targetSelector, insertMethod);
    }

    /**
     * Load footer component
     */
    async loadFooter(targetSelector = 'footer', insertMethod = 'innerHTML') {
        return await this.insertComponent('footer', targetSelector, insertMethod);
    }

    /**
     * Initialize components for a page
     */
    async initializePage(config = {}) {
        const defaultConfig = {
            loadNavbar: false,
            loadSidebar: false,
            loadFooter: true,
            navbarTarget: 'header',
            sidebarTarget: '.sidebar-container',
            footerTarget: 'footer'
        };

        const pageConfig = { ...defaultConfig, ...config };

        const promises = [];

        if (pageConfig.loadNavbar) {
            promises.push(this.loadNavbar(pageConfig.navbarTarget));
        }

        if (pageConfig.loadSidebar) {
            promises.push(this.loadSidebar(pageConfig.sidebarTarget));
        }

        if (pageConfig.loadFooter) {
            promises.push(this.loadFooter(pageConfig.footerTarget));
        }

        try {
            await Promise.all(promises);
            console.log('✅ Components loaded successfully');
            
            // Trigger custom event when components are loaded
            document.dispatchEvent(new CustomEvent('componentsLoaded'));
            
            return true;
        } catch (error) {
            console.error('❌ Error loading components:', error);
            return false;
        }
    }
}

// Create global instance
window.componentLoader = new ComponentLoader();

// Auto-initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Page-specific component loading
    switch (currentPage) {
        case 'category.html':
            window.componentLoader.initializePage({
                loadNavbar: true,
                loadSidebar: true,
                loadFooter: true,
                navbarTarget: '#navbar-container',
                sidebarTarget: '#sidebar-container',
                footerTarget: '#footer-container'
            });
            break;
            
        case 'post.html':
            window.componentLoader.initializePage({
                loadNavbar: true,
                loadSidebar: true,
                loadFooter: true,
                navbarTarget: '#navbar-container',
                sidebarTarget: '#sidebar-container',
                footerTarget: '#footer-container'
            });
            break;
            
        case 'tag.html':
            window.componentLoader.initializePage({
                loadNavbar: true,
                loadSidebar: true,
                loadFooter: true,
                navbarTarget: '#navbar-container',
                sidebarTarget: '#sidebar-container',
                footerTarget: '#footer-container'
            });
            break;
            
        case 'search.html':
            window.componentLoader.initializePage({
                loadNavbar: true,
                loadSidebar: true,
                loadFooter: true,
                navbarTarget: '#navbar-container',
                sidebarTarget: '#sidebar-container',
                footerTarget: '#footer-container'
            });
            break;
            
        default:
            // Homepage and other pages only load footer if needed
            if (document.querySelector('#footer-container')) {
                window.componentLoader.initializePage({
                    loadFooter: true,
                    footerTarget: '#footer-container'
                });
            }
    }
}); 
/**
 * Dynamic Search Functionality for No Life Anime
 * Handles both desktop and mobile search with real-time results
 */

class SearchManager {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.searchTimeout = null;
        this.currentSearchTerm = '';
        this.isSearching = false;
        
        // Initialize when components are loaded
        document.addEventListener('componentsLoaded', () => {
            this.initializeSearch();
        });
        
        // Fallback initialization
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.initializeSearch(), 1000);
        });
    }

    initializeSearch() {
        this.initializeDesktopSearch();
        this.initializeMobileSearch();
        this.initializeSearchPopup();
        console.log('✅ Search functionality initialized');
    }

    /**
     * Initialize desktop search functionality
     */
    initializeDesktopSearch() {
        const searchInput = document.getElementById('desktop-search-input');
        const searchForm = document.getElementById('desktop-search-form');
        const searchResults = document.getElementById('desktop-search-results');

        if (!searchInput || !searchForm || !searchResults) {
            console.warn('Desktop search elements not found');
            return;
        }

        // Real-time search as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.handleSearchInput(query, searchResults, 'desktop');
        });

        // Handle form submission
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                this.performSearch(query, searchResults, 'desktop');
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchForm.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });

        // Show results when focusing on input
        searchInput.addEventListener('focus', () => {
            if (searchResults.innerHTML.trim()) {
                searchResults.style.display = 'block';
            }
        });
    }

    /**
     * Initialize mobile search functionality
     */
    initializeMobileSearch() {
        const mobileSearchBtn = document.getElementById('mobile-search-btn');
        const searchPopup = document.getElementById('td-search-popup');
        const searchInput = document.getElementById('mobile-search-input');
        const searchResults = document.getElementById('mobile-search-results');

        if (!mobileSearchBtn || !searchPopup || !searchInput || !searchResults) {
            console.warn('Mobile search elements not found');
            return;
        }

        // Open search popup
        mobileSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSearchPopup();
        });

        // Real-time search as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.handleSearchInput(query, searchResults, 'mobile');
        });
    }

    /**
     * Initialize search popup controls
     */
    initializeSearchPopup() {
        const searchPopup = document.getElementById('td-search-popup');
        const closeBtn = document.getElementById('search-close-btn');
        const bodyOverlay = document.getElementById('body-overlay');

        if (!searchPopup || !closeBtn) {
            console.warn('Search popup elements not found');
            return;
        }

        // Close popup handlers
        closeBtn.addEventListener('click', () => {
            this.closeSearchPopup();
        });

        if (bodyOverlay) {
            bodyOverlay.addEventListener('click', () => {
                this.closeSearchPopup();
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchPopup.classList.contains('active')) {
                this.closeSearchPopup();
            }
        });
    }

    /**
     * Handle search input with debouncing
     */
    handleSearchInput(query, resultsContainer, searchType) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Hide results if query is empty
        if (!query) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        // Show loading state immediately
        resultsContainer.innerHTML = '<div class="search-loading">Yazdıktan sonra birazcık bekleyiniz.</div>';
        resultsContainer.style.display = 'block';

        // Debounce search requests (1.5 seconds)
        this.searchTimeout = setTimeout(() => {
            resultsContainer.innerHTML = '<div class="search-loading">Aranıyor...</div>';
            this.performSearch(query, resultsContainer, searchType);
        }, 1500);
    }

    /**
     * Perform actual search
     */
    async performSearch(query, resultsContainer, searchType) {
        if (this.isSearching || !query) return;

        this.isSearching = true;
        this.currentSearchTerm = query;

        console.log(`🔍 Starting search for: "${query}"`);

        try {
            const searchUrl = `${this.API_URL}/posts/search?q=${encodeURIComponent(query)}`;
            console.log(`📡 Fetching: ${searchUrl}`);
            
            const response = await fetch(searchUrl);
            console.log(`📊 Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error (${response.status}):`, errorText);
                throw new Error(`Search request failed: ${response.status} - ${response.statusText}`);
            }

            const results = await response.json();
            console.log(`✅ Search results:`, results);
            this.displaySearchResults(results, resultsContainer, searchType, query);

        } catch (error) {
            console.error('🚨 Search error:', error);
            
            // More specific error messages
            let errorMessage = 'Arama hatası oluştu.';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Arama servisi bulunamadı.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Sunucu hatası oluştu.';
            }
            
            resultsContainer.innerHTML = `<div class="search-error">${errorMessage}<br><small>Detay: ${error.message}</small></div>`;
        } finally {
            this.isSearching = false;
        }
    }

    /**
     * Display search results
     */
    displaySearchResults(results, resultsContainer, searchType, query) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>"${query}" için sonuç bulunamadı.</p>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        const resultsHTML = results.slice(0, 8).map(post => {
            const thumbnail = this.getThumbnailUrl(post.thumbnail);
            const title = this.highlightSearchTerm(post.title, query);
            const categoryInfo = this.getCategoryInfo(post.contentCategory);
            
            return `
                <div class="search-result-item" data-post-id="${post._id}">
                    <div class="search-result-thumb">
                        <img src="${thumbnail}" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="search-result-content">
                        <h6 class="search-result-title">
                            <a href="post.html?id=${post._id}">${title}</a>
                        </h6>
                        <div class="search-result-meta">
                            <span class="search-result-category ${categoryInfo.class}">${categoryInfo.name}</span>
                            <span class="search-result-date">${this.formatDate(post.createdAt)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const totalResults = results.length;
        const showAllLink = totalResults > 8 ? 
            `<div class="search-show-all">
                <a href="search.html?q=${encodeURIComponent(query)}" class="show-all-link">
                    Tüm Sonuçları Gör (${totalResults}) <i class="fa fa-arrow-right"></i>
                </a>
            </div>` : '';

        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h6>${totalResults} sonuç bulundu</h6>
            </div>
            <div class="search-results-list">
                ${resultsHTML}
            </div>
            ${showAllLink}
        `;

        resultsContainer.style.display = 'block';

        // Add click handlers for results
        this.addResultClickHandlers(resultsContainer);
    }

    /**
     * Add click handlers to search results
     */
    addResultClickHandlers(resultsContainer) {
        const resultItems = resultsContainer.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on a link
                if (e.target.tagName === 'A') return;
                
                const postId = item.getAttribute('data-post-id');
                if (postId) {
                    window.location.href = `post.html?id=${postId}`;
                }
            });
        });
    }

    /**
     * Open search popup
     */
    openSearchPopup() {
        const searchPopup = document.getElementById('td-search-popup');
        const bodyOverlay = document.getElementById('body-overlay');
        const searchInput = document.getElementById('mobile-search-input');

        if (searchPopup) {
            searchPopup.classList.add('active');
            document.body.classList.add('search-popup-open');
            
            if (bodyOverlay) {
                bodyOverlay.classList.add('active');
            }

            // Focus on search input
            setTimeout(() => {
                        if (searchInput) {
            searchInput.focus();
        }
        
        // Show empty state initially
        const resultsContainer = document.getElementById('mobile-search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <h3>Ne arıyorsun?</h3>
                    <p>Post başlığında aramak için yukarıdaki kutuya yazın.</p>
                </div>
            `;
        }
            }, 100);
        }
    }

    /**
     * Close search popup
     */
    closeSearchPopup() {
        const searchPopup = document.getElementById('td-search-popup');
        const bodyOverlay = document.getElementById('body-overlay');
        const resultsContainer = document.getElementById('mobile-search-results');

        if (searchPopup) {
            searchPopup.classList.remove('active');
            document.body.classList.remove('search-popup-open');
            
            if (bodyOverlay) {
                bodyOverlay.classList.remove('active');
            }

            // Clear search results and show empty state
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="search-empty-state">
                        <h3>Ne arıyorsun?</h3>
                        <p>Post başlığında aramak için yukarıdaki kutuya yazın.</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Highlight search term in text
     */
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Get thumbnail URL with fallback
     */
    getThumbnailUrl(thumbnail) {
        if (!thumbnail) return 'assets/img/nolife-favicon.png';
        
        if (thumbnail.startsWith('http')) {
            return thumbnail;
        }
        
        if (thumbnail.includes('thumbnails/')) {
            return `https://res.cloudinary.com/dtg5lgkad/image/upload/v1/${thumbnail}`;
        }
        
        return 'assets/img/nolife-favicon.png';
    }

    /**
     * Get category info
     */
    getCategoryInfo(category) {
        const categories = {
            'haber': { name: 'HABER', class: 'tag-blue' },
            'liste': { name: 'LİSTE', class: 'tag-green' },
            'inceleme': { name: 'İNCELEME', class: 'tag-purple' },
            'teori': { name: 'TEORİ', class: 'tag-orange' }
        };
        
        return categories[category] || { name: category?.toUpperCase() || 'GENEL', class: 'tag-blue' };
    }

    /**
     * Format date to Turkish locale
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Initialize search manager
window.searchManager = new SearchManager();
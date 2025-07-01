/**
 * Search Page Functionality for No Life Anime
 * Handles search page with URL parameters and displays results
 */

class SearchPageManager {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentQuery = '';
        this.currentPage = 1;
        this.postsPerPage = 12;
        this.totalPosts = 0;
        this.totalPages = 0;
        
        // Initialize when components are loaded
        document.addEventListener('componentsLoaded', () => {
            this.initializeSearchPage();
        });
        
        // Fallback initialization
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.initializeSearchPage(), 1000);
        });
    }

    initializeSearchPage() {
        this.parseURLParameters();
        this.performInitialSearch();
        console.log('✅ Search page functionality initialized');
    }

    /**
     * Parse URL parameters to get search query
     */
    parseURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        const page = parseInt(urlParams.get('page')) || 1;

        if (query) {
            this.currentQuery = query;
            this.currentPage = page;
        }
    }

    /**
     * Perform initial search based on URL parameters
     */
    performInitialSearch() {
        if (this.currentQuery) {
            this.performSearch(this.currentQuery, this.currentPage);
        } else {
            this.showNoQueryMessage();
        }
    }

    /**
     * Perform search and display results
     */
    async performSearch(query, page = 1) {
        if (!query || query.trim().length === 0) {
            this.showNoQueryMessage();
            return;
        }

        this.currentQuery = query.trim();
        this.currentPage = page;
        
        // Update URL without refreshing page
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(this.currentQuery)}&page=${this.currentPage}`;
        window.history.pushState({ query: this.currentQuery, page: this.currentPage }, '', newUrl);

        // Update page title and breadcrumb
        this.updatePageElements();

        // Show loading state
        this.showLoadingState();

        try {
            const response = await fetch(`${this.API_URL}/posts/search?q=${encodeURIComponent(this.currentQuery)}`);
            
            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const allResults = await response.json();
            this.totalPosts = allResults.length;
            this.totalPages = Math.ceil(this.totalPosts / this.postsPerPage);

            // Paginate results client-side
            const startIndex = (page - 1) * this.postsPerPage;
            const endIndex = startIndex + this.postsPerPage;
            const paginatedResults = allResults.slice(startIndex, endIndex);

            this.displaySearchResults(paginatedResults);
            this.setupPagination();

        } catch (error) {
            console.error('Search error:', error);
            this.showErrorMessage();
        }
    }

    /**
     * Update page title and breadcrumb
     */
    updatePageElements() {
        // Update page title
        const pageTitle = document.getElementById('search-title');
        if (pageTitle) {
            pageTitle.textContent = `"${this.currentQuery}" Arama Sonuçları`;
        }

        // Update breadcrumb
        const breadcrumbTerm = document.getElementById('breadcrumb-search-term');
        if (breadcrumbTerm) {
            breadcrumbTerm.textContent = `"${this.currentQuery}"`;
        }

        // Update document title
        document.title = `"${this.currentQuery}" Arama Sonuçları | No Life Anime`;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const postsContainer = document.getElementById('posts-container');
        const searchInfo = document.getElementById('search-info');

        if (postsContainer) {
            postsContainer.innerHTML = '<div class="col-12 text-center"><p>Arama sonuçları yükleniyor...</p></div>';
        }

        if (searchInfo) {
            searchInfo.innerHTML = '<p class="search-results-count">Aranıyor...</p>';
        }
    }

    /**
     * Display search results
     */
    displaySearchResults(posts) {
        const postsContainer = document.getElementById('posts-container');
        const searchInfo = document.getElementById('search-info');

        if (!posts || posts.length === 0) {
            this.showNoResultsMessage();
            return;
        }

        // Update search info
        if (searchInfo) {
            const startPost = (this.currentPage - 1) * this.postsPerPage + 1;
            const endPost = Math.min(this.currentPage * this.postsPerPage, this.totalPosts);
            
            searchInfo.innerHTML = `
                <p class="search-results-count">
                    <strong>"${this.currentQuery}"</strong> için <strong>${this.totalPosts}</strong> sonuç bulundu
                    (${startPost}-${endPost} arası gösteriliyor)
                </p>
            `;
        }

        // Generate posts HTML using the same layout as category/tag pages
        const postsHTML = posts.map(post => {
            const thumbnail = this.getThumbnailUrl(post.thumbnail);
            
            // Format categories for display
            const formatCategory = post.formatCategory || "";
            const contentCategory = post.contentCategory || "";

            const formattedFormatCategoryName = formatCategory.charAt(0).toUpperCase() + formatCategory.slice(1);
            const formattedContentCategoryName = contentCategory.charAt(0).toUpperCase() + contentCategory.slice(1);
            
            return `
                <div class="col-lg-4 col-md-6">
                    <div class="single-post-wrap style-box">
                        <div class="thumb">
                            <img src="${thumbnail}" alt="${post.title}" loading="lazy">
                        </div>
                        <div class="details">
                            <div class="post-meta-single mb-4 pt-1">
                                <ul class="category-tag-container">
                                    <li>
                                        <a class="tag-base tag-light-blue" href="category.html?slug=${formatCategory}">${formattedFormatCategoryName}</a>
                                    </li>
                                    <li>
                                        <a class="tag-base tag-light-blue" href="category.html?slug=${contentCategory}">${formattedContentCategoryName}</a>
                                    </li>
                                </ul>
                            </div>
                            <h6 class="title">
                                <a href="post.html?id=${post._id}">${post.title}</a>
                            </h6>
                            <a class="btn btn-base mt-4" href="post.html?id=${post._id}">Okumak için >></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (postsContainer) {
            postsContainer.innerHTML = postsHTML;
        }
    }

    /**
     * Setup pagination
     */
    setupPagination() {
        const paginationContainer = document.querySelector('.pagination-container .pagination');
        
        if (!paginationContainer || this.totalPages <= 1) {
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item prev ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage > 1 ? this.currentPage - 1 : '#'}" aria-label="Previous">
                    <i class="fa fa-angle-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item next ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage < this.totalPages ? this.currentPage + 1 : '#'}" aria-label="Next">
                    <i class="fa fa-angle-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Show pagination container
        document.querySelector('.pagination-container').style.display = this.totalPages > 1 ? 'block' : 'none';

        // Add click handlers
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const pageLink = e.target.closest('[data-page]');
            if (pageLink && pageLink.getAttribute('data-page') !== '#') {
                const page = parseInt(pageLink.getAttribute('data-page'));
                this.performSearch(this.currentQuery, page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    /**
     * Show no query message
     */
    showNoQueryMessage() {
        const postsContainer = document.getElementById('posts-container');
        const searchInfo = document.getElementById('search-info');

        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="no-posts-found">
                        <i class="fa fa-search" style="font-size: 48px; color: #ddd; margin-bottom: 20px;"></i>
                        <h4>Arama Yapmak İçin</h4>
                        <p>Yukarıdaki arama kutusuna post başlığı yazın.</p>
                    </div>
                </div>
            `;
        }

        if (searchInfo) {
            searchInfo.innerHTML = '<p class="search-results-count">Arama terimi girin</p>';
        }
    }

    /**
     * Show no results message
     */
    showNoResultsMessage() {
        const postsContainer = document.getElementById('posts-container');
        const searchInfo = document.getElementById('search-info');

        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="no-posts-found">
                        <i class="fa fa-search" style="font-size: 48px; color: #ddd; margin-bottom: 20px;"></i>
                        <h4>"${this.currentQuery}" için sonuç bulunamadı</h4>
                        <p>Farklı kelimeler deneyebilir veya arama terimini değiştirebilirsiniz.</p>
                    </div>
                </div>
            `;
        }

        if (searchInfo) {
            searchInfo.innerHTML = `<p class="search-results-count">"${this.currentQuery}" için <strong>0</strong> sonuç bulundu</p>`;
        }
    }

    /**
     * Show error message
     */
    showErrorMessage() {
        const postsContainer = document.getElementById('posts-container');
        const searchInfo = document.getElementById('search-info');

        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="no-posts-found">
                        <i class="fa fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                        <h4>Arama Hatası</h4>
                        <p>Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>
                    </div>
                </div>
            `;
        }

        if (searchInfo) {
            searchInfo.innerHTML = '<p class="search-results-count">Arama hatası oluştu</p>';
        }
    }

    /**
     * Utility functions
     */
    getThumbnailUrl(thumbnail) {
        if (!thumbnail) return 'assets/img/placeholder.jpg';
        
        if (thumbnail.startsWith('http')) {
            return thumbnail;
        }
        
        if (thumbnail.includes('thumbnails/')) {
            return `https://res.cloudinary.com/dpwktwbzk/image/upload/${thumbnail}`;
        }
        
        return 'assets/img/placeholder.jpg';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Initialize search page manager
window.searchPageManager = new SearchPageManager(); 
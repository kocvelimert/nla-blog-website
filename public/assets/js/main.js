/**
 * Main JavaScript File for No Life Anime
 * Handles UI functionality and dynamic content loading
 */

;(function ($) {
    "use strict";

    // ==============================================
    // CONFIGURATION
    // ==============================================
    const CONFIG = {
        API_URL: 'http://localhost:3000',
        CLOUDINARY_BASE: 'https://res.cloudinary.com/dpwktwbzk/image/upload/',
        PLACEHOLDER_IMAGE: 'assets/img/placeholder.jpg'
    };

    // Category mappings for the trending section
    const CATEGORIES = {
        'haber': { name: 'HABER', class: 'tag-blue' },
        'liste': { name: 'LİSTE', class: 'tag-green' },
        'inceleme': { name: 'İNCELEME', class: 'tag-purple' },
        'teori': { name: 'TEORİ', class: 'tag-orange' }
    };

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    
    /**
     * Format date to Turkish locale
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Get thumbnail URL with fallback
     */
    function getThumbnailUrl(thumbnail) {
        if (!thumbnail) return CONFIG.PLACEHOLDER_IMAGE;
        
        if (thumbnail.startsWith('http')) {
            return thumbnail;
        }
        
        if (thumbnail.includes('thumbnails/')) {
            return CONFIG.CLOUDINARY_BASE + thumbnail;
        }
        
        return CONFIG.PLACEHOLDER_IMAGE;
    }

    /**
     * Truncate text to specified length
     */
    function truncateText(text, maxLength = 150) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Get category display info
     */
    function getCategoryInfo(category) {
        return CATEGORIES[category] || { name: category.toUpperCase(), class: 'tag-blue' };
    }

    /**
     * Extract meaningful preview text from post content
     */
    function extractPreviewText(post, maxLength = 150) {
        // Try multiple sources for preview text
        let previewText = '';
        
        // 1. Check if post has a description field
        if (post.description && post.description.trim()) {
            previewText = post.description.trim();
        }
        // 2. Extract from content blocks
        else if (post.content && Array.isArray(post.content)) {
            previewText = extractFromContentBlocks(post.content);
        }
        // 3. Fallback to title-based preview
        else if (post.title) {
            previewText = `${post.title} hakkında detaylı bilgi için makaleyi okuyun.`;
        }
        
        // Clean and truncate the text
        return cleanAndTruncateText(previewText, maxLength);
    }
    
    /**
     * Extract text from content blocks intelligently
     */
    function extractFromContentBlocks(contentBlocks) {
        let extractedText = '';
        
        for (const block of contentBlocks) {
            // Skip non-text blocks
            if (['image', 'youtube'].includes(block.type)) {
                continue;
            }
            
            let blockText = '';
            
            // Extract text based on block type
            switch (block.type) {
                case 'paragraph':
                    blockText = extractTextFromHTML(block.text || block.content || '');
                    break;
                case 'heading':
                    // Use headings but with lower priority
                    blockText = extractTextFromHTML(block.text || block.content || '');
                    break;
                case 'blockquote':
                    blockText = extractTextFromHTML(block.text || block.content || '');
                    blockText = blockText ? `"${blockText}"` : '';
                    break;
                case 'bulletList':
                case 'orderedList':
                    blockText = extractTextFromHTML(block.content || block.text || '');
                    // Clean up list formatting
                    blockText = blockText.replace(/^\s*[\d\-•]\s*/gm, '').replace(/\n+/g, ' ');
                    break;
            }
            
            // Clean the extracted text
            blockText = blockText.trim();
            
            // If this block has meaningful content, use it
            if (blockText && blockText.length > 20) {
                extractedText = blockText;
                break; // Use the first meaningful block
            }
        }
        
        return extractedText;
    }
    
    /**
     * Extract plain text from HTML content
     */
    function extractTextFromHTML(htmlContent) {
        if (!htmlContent) return '';
        
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Get text content and clean it up
        let text = tempDiv.textContent || tempDiv.innerText || '';
        
        // Clean up extra whitespace and normalize
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }
    
    /**
     * Clean and truncate text for preview
     */
    function cleanAndTruncateText(text, maxLength = 150) {
        if (!text) return 'Bu yazıda ilginç detaylar sizleri bekliyor.';
        
        // Clean the text
        text = text.trim();
        
        // Remove any remaining HTML entities
        text = text.replace(/&[a-zA-Z0-9#]+;/g, '');
        
        // If text is shorter than max length, return as is
        if (text.length <= maxLength) {
            return text;
        }
        
        // Truncate at word boundary
        let truncated = text.substring(0, maxLength);
        
        // Find the last complete word
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        if (lastSpaceIndex > maxLength * 0.8) { // Only if we're not cutting too much
            truncated = truncated.substring(0, lastSpaceIndex);
        }
        
        // Add ellipsis and ensure it ends properly
        truncated = truncated.trim();
        if (truncated && !truncated.match(/[.!?]$/)) {
            truncated += '...';
        }
        
        return truncated || 'Bu yazıda ilginç detaylar sizleri bekliyor.';
    }

    // ==============================================
    // API FUNCTIONS
    // ==============================================

    /**
     * Fetch latest posts for hero section
     */
    async function fetchLatestPosts(limit = 5) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/posts/latest?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch latest posts');
            return await response.json();
        } catch (error) {
            console.error('Error fetching latest posts:', error);
            return [];
        }
    }

    /**
     * Fetch posts by category
     */
    async function fetchPostsByCategory(category, limit = 4) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/posts/category/${category}?limit=${limit}`);
            if (!response.ok) throw new Error(`Failed to fetch posts for category: ${category}`);
            const data = await response.json();
            return data.posts || data;
        } catch (error) {
            console.error(`Error fetching posts for category ${category}:`, error);
            return [];
        }
    }

    /**
     * Fetch all posts for main content area
     */
    async function fetchAllPosts() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/posts`);
            if (!response.ok) throw new Error('Failed to fetch all posts');
            return await response.json();
        } catch (error) {
            console.error('Error fetching all posts:', error);
            return [];
        }
    }

    // ==============================================
    // CONTENT RENDERING FUNCTIONS
    // ==============================================

    /**
     * Render hero section with latest posts
     */
    function renderHeroSection(posts) {
        if (!posts || posts.length === 0) {
            $('#hero-banner').html(`
                <div class="container">
                    <div class="row">
                        <div class="col-12 text-center">
                            <p>Henüz içerik bulunmuyor.</p>
                        </div>
                    </div>
                </div>
            `);
            return;
        }

        const mainPost = posts[0];
        const categoryInfo = getCategoryInfo(mainPost.contentCategory);
        const formattedDate = formatDate(mainPost.createdAt);
        
        const bannerHTML = `
            <div class="container">
                <div class="row">
                    <div class="col-lg-6">
                        <div class="thumb after-left-top">
                            <img src="${getThumbnailUrl(mainPost.thumbnail)}" alt="${mainPost.title}">
                        </div>
                    </div>
                    <div class="col-lg-6 align-self-center">
                        <div class="banner-details mt-4 mt-lg-0">
                            <div class="post-meta-single">
                                <ul>
                                    <li><a class="tag-base ${categoryInfo.class}" href="category.html?slug=${mainPost.contentCategory}">${categoryInfo.name}</a></li>
                                    <li class="date"><i class="fa fa-clock-o"></i>${formattedDate}</li>
                                </ul>
                            </div>
                            <h2>${mainPost.title}</h2>
                            <p>${extractPreviewText(mainPost, 200)}</p>
                            <a class="btn btn-blue" href="post.html?id=${mainPost._id}">Devamını Oku</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#hero-banner').html(bannerHTML);
    }

    /**
     * Render trending section tabs
     */
    function renderTrendingSection() {
        // Update tab labels to match our categories
        const tabs = [
            { id: 'haber', name: 'HABER' },
            { id: 'liste', name: 'LİSTE' },
            { id: 'inceleme', name: 'İNCELEME' },
            { id: 'teori', name: 'TEORİ' }
        ];

        // Update tab navigation
        const tabNav = $('#enx1');
        tabNav.empty();
        
        tabs.forEach((tab, index) => {
            const isActive = index === 0 ? 'active' : '';
            tabNav.append(`
                <li class="nav-item" role="presentation">
                    <a class="nav-link ${isActive}" id="enx1-tab-${index + 1}" data-toggle="pill" 
                       href="#enx1-tabs-${index + 1}" role="tab" aria-selected="${index === 0}">
                        ${tab.name}
                    </a>
                </li>
            `);
        });

        // Load content for each tab
        tabs.forEach((tab, index) => {
            loadCategoryContent(tab.id, index + 1);
        });
    }

    /**
     * Load content for a specific category tab
     */
    async function loadCategoryContent(category, tabIndex) {
        const posts = await fetchPostsByCategory(category, 4);
        const tabContent = $(`#enx1-tabs-${tabIndex}`);
        
        if (!tabContent.length) return;

        const postsHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.contentCategory);
            return `
                <div class="col-lg-3 col-sm-6">
                    <div class="single-post-wrap">
                        <div class="thumb">
                            <img src="${getThumbnailUrl(post.thumbnail)}" alt="${post.title}">
                            <a class="tag-base ${categoryInfo.class}" href="category.html?slug=${post.contentCategory}">${categoryInfo.name}</a>
                        </div>
                        <div class="details">
                            <div class="post-meta-single mb-3">
                                <ul>
                                    <li><i class="fa fa-clock-o"></i>${formatDate(post.createdAt)}</li>
                                    <li><i class="fa fa-user"></i>${post.author || 'Anonim'}</li>
                                </ul>
                            </div>
                            <h6><a href="post.html?id=${post._id}">${post.title}</a></h6>
                            <p>${extractPreviewText(post, 100)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        tabContent.html(`<div class="row">${postsHTML}</div>`);
    }

    /**
     * Render main posts section
     */
    function renderMainPosts(posts) {
        const container = $('#post-container');
        
        if (!posts || posts.length === 0) {
            container.html(`
                <div class="col-12 text-center">
                    <p>Henüz yayınlanmış içerik bulunmuyor.</p>
                </div>
            `);
            return;
        }

        const postsHTML = posts.slice(0, 12).map(post => {
            const formatCategoryInfo = getCategoryInfo(post.formatCategory);
            const contentCategoryInfo = getCategoryInfo(post.contentCategory);
            
            return `
                <div class="col-lg-4 col-md-6">
                    <div class="single-post-wrap style-box">
                        <div class="thumb">
                            <img src="${getThumbnailUrl(post.thumbnail)}" alt="${post.title}">
                        </div>
                        <div class="details">
                            <div class="post-meta-single mb-4 pt-1">
                                <ul class="category-tag-container">
                                    <li>
                                        <a class="tag-base ${formatCategoryInfo.class}" href="category.html?slug=${post.formatCategory}">
                                            ${post.formatCategory?.toUpperCase() || 'GENEL'}
                                        </a>
                                    </li>
                                    <li>
                                        <a class="tag-base ${contentCategoryInfo.class}" href="category.html?slug=${post.contentCategory}">
                                            ${contentCategoryInfo.name}
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <h6 class="title">
                                <a href="post.html?id=${post._id}">${post.title}</a>
                            </h6>
                            <p class="post-preview">${extractPreviewText(post, 120)}</p>
                            <div class="post-meta-single mt-3">
                                <ul>
                                    <li><i class="fa fa-clock-o"></i>${formatDate(post.createdAt)}</li>
                                    <li><i class="fa fa-user"></i>${post.author || 'Anonim'}</li>
                                </ul>
                            </div>
                            <a class="btn btn-base mt-4" href="post.html?id=${post._id}">Okumak için >></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.html(postsHTML);
    }

    // ==============================================
    // INITIALIZATION FUNCTIONS
    // ==============================================

    /**
     * Initialize dynamic content
     */
    async function initializeDynamicContent() {
        // Only load on homepage
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            return;
        }
        
        try {
            console.log('🚀 Loading homepage content...');

            // Fetch and render content
            const [latestPosts, allPosts] = await Promise.all([
                fetchLatestPosts(5),
                fetchAllPosts()
            ]);

            console.log('📚 Loaded posts:', { latest: latestPosts.length, all: allPosts.length });

            // Render sections
            renderHeroSection(latestPosts);
            renderFeaturedPosts(latestPosts.slice(1, 5)); // Skip first post used in hero
            renderTrendingTabs();

            console.log('✅ Homepage content loaded successfully');
        } catch (error) {
            console.error('❌ Error loading homepage content:', error);
            
            // Show error state
            $('#hero-banner').html(`
                <div class="container">
                    <div class="row">
                <div class="col-12 text-center">
                    <div class="error-message">
                        <h4>İçerik Yükleme Hatası</h4>
                        <p>İçerikler şu anda yüklenemiyor. Lütfen sayfayı yenileyin.</p>
                        <button class="btn btn-base" onclick="location.reload()">Sayfayı Yenile</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }
    }

    /**
     * Render featured posts for banner bottom section
     */
    function renderFeaturedPosts(posts) {
        if (!posts || posts.length === 0) {
            $('#featured-posts').html('<div class="row"><div class="col-12 text-center"><p>Henüz içerik bulunmuyor.</p></div></div>');
            return;
        }

        const postsHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.formatCategory);
            const formattedDate = formatDate(post.createdAt);
            
            return `
                <div class="col-lg-3 col-sm-6">
                    <div class="single-post-wrap style-white">
                        <div class="thumb">
                            <img src="${getThumbnailUrl(post.thumbnail)}" alt="${post.title}">
                            <a class="tag-base ${categoryInfo.class}" href="category.html?slug=${post.formatCategory}">${post.formatCategory.toUpperCase()}</a>
                        </div>
                        <div class="details">
                            <h6 class="title"><a href="post.html?id=${post._id}">${post.title}</a></h6>
                            <div class="post-meta-single mt-3">
                                <ul>
                                    <li><i class="fa fa-clock-o"></i>${formattedDate}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        $('#featured-posts').html(`<div class="row">${postsHTML}</div>`);
    }

    /**
     * Render trending tabs with category content
     */
    function renderTrendingTabs() {
        const categories = ['anime', 'manga', 'manhwa', 'haber', 'liste'];
        
        categories.forEach(category => {
            fetchPostsByCategory(category, 4)
                .then(posts => {
                    if (posts && posts.length > 0) {
                        renderCategoryPosts(category, posts);
                    } else {
                        $(`#${category}-posts`).html('<div class="col-12 text-center"><p>Bu kategoride henüz içerik bulunmuyor.</p></div>');
                    }
                })
                .catch(error => {
                    console.error(`Error loading ${category} posts:`, error);
                    $(`#${category}-posts`).html('<div class="col-12 text-center"><p>İçerik yüklenirken hata oluştu.</p></div>');
                });
        });
    }

    /**
     * Render posts for a specific category
     */
    function renderCategoryPosts(category, posts) {
        const postsHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.contentCategory);
            const formattedDate = formatDate(post.createdAt);
            
            return `
                <div class="col-lg-3 col-sm-6">
                    <div class="single-post-wrap">
                        <div class="thumb">
                            <img src="${getThumbnailUrl(post.thumbnail)}" alt="${post.title}">
                            <a class="tag-base ${categoryInfo.class}" href="category.html?slug=${post.contentCategory}">${categoryInfo.name}</a>
                        </div>
                        <div class="details">
                            <div class="post-meta-single mb-3">
                                <ul>
                                    <li><i class="fa fa-clock-o"></i>${formattedDate}</li>
                                    <li><i class="fa fa-user"></i>${post.author || 'No Life Anime'}</li>
                                </ul>
                            </div>
                            <h6><a href="post.html?id=${post._id}">${post.title}</a></h6>
                            <p>${extractPreviewText(post, 100)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        $(`#${category}-posts`).html(postsHTML);
    }

    /**
     * Initialize UI components
     */
    function initializeUIComponents() {
        // Mobile menu functionality
        initializeMobileMenu();
        
        // Initialize select styling if needed
        if ($('select').length) {
            $('select').niceSelect();
        }

        // Initialize carousels if present
        initializeCarousels();

        // Initialize popup functionality
        initializePopups();

        // Initialize search functionality
        initializeSearch();

        // Initialize animations
        if (typeof WOW !== 'undefined') {
            new WOW().init();
        }

        // Initialize back to top
        initializeBackToTop();
    }

    /**
     * Initialize mobile menu
     */
    function initializeMobileMenu() {
        function setupMobileMenu() {
            if ($(window).width() < 992) {
                // Prevent default click on parent menu items
                $(document).on('click', '.navbar-area .navbar-nav li.menu-item-has-children>a', function (e) {
                    e.preventDefault();
                });

                // Toggle mobile menu
                $('.navbar-area .menu').on('click', function () {
                    $(this).toggleClass('open');
                    $('.navbar-area .navbar-collapse').toggleClass('sopen');
                });

                // Submenu toggle functionality
                $(".menu-item-has-children a").on('click', function (e) {
                    $(this).siblings('.sub-menu').animate({
                        height: "toggle"
                    }, 300);
                });
            }
        }

        setupMobileMenu();
        $(window).resize(setupMobileMenu);
    }

    /**
     * Initialize carousel components
     */
    function initializeCarousels() {
        const leftArrow = '<i class="la la-angle-left"></i>';
        const rightArrow = '<i class="la la-angle-right"></i>';

        // Post slider
        $('.post-slider').owlCarousel({
            loop: true,
            margin: 30,
            nav: true,
            dots: false,
            smartSpeed: 1500,
            navText: [leftArrow, rightArrow],
            responsive: {
                0: { items: 1 },
                576: { items: 1 },
                992: { items: 1 }
            }
        });

        // Most viewed slider
        $('.most-view-slider').owlCarousel({
            loop: true,
            nav: false,
            dots: true,
            smartSpeed: 1500,
            center: true,
            items: 3,
            responsive: {
                0: { items: 1 },
                576: { items: 1 },
                768: { items: 3 }
            }
        });
    }

    /**
     * Initialize popup functionality
     */
    function initializePopups() {
        $('.video-play-btn').magnificPopup({
            type: 'iframe',
            removalDelay: 260,
            mainClass: 'mfp-zoom-in',
        });

        $.extend(true, $.magnificPopup.defaults, {
            iframe: {
                patterns: {
                    youtube: {
                        index: 'youtube.com',
                        id: 'v=',
                        src: 'https://www.youtube.com/embed/%id%'
                    }
                }
            }
        });
    }

    /**
     * Initialize search functionality
     */
    function initializeSearch() {
        const bodyOverlay = $('#body-overlay');
        const searchPopup = $('#td-search-popup');

        $(document).on('click', '#body-overlay', function (e) {
            e.preventDefault();
            bodyOverlay.removeClass('active');
            searchPopup.removeClass('active');
        });

        $(document).on('click', '.search', function (e) {
            e.preventDefault();
            searchPopup.addClass('active');
            bodyOverlay.addClass('active');
        });
    }

    /**
     * Initialize back to top functionality
     */
    function initializeBackToTop() {
        $(document).on('click', '.back-to-top', function () {
            $("html,body").animate({ scrollTop: 0 }, 2000);
        });
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    $(document).ready(function () {
        console.log('🎌 No Life Anime - Initializing...');
        
        // Initialize UI components
        initializeUIComponents();
        
        // Initialize dynamic content
        initializeDynamicContent();
    });

    $(window).on("scroll", function () {
        // Back to top visibility
        const scrollTop = $('.back-to-top');
        if ($(window).scrollTop() > 1000) {
            scrollTop.fadeIn(1000);
        } else {
            scrollTop.fadeOut(1000);
        }

        // Sticky navbar
        const scroll = $(window).scrollTop();
        if (scroll < 445) {
            $(".navbar").removeClass("sticky-active");
        } else {
            $(".navbar").addClass("sticky-active");
        }
    });

    $(window).on('load', function () {
        // Hide preloader
        $("#preloader").fadeOut(0);
        
        // Hide back to top initially
        $('.back-to-top').fadeOut();

        // Cancel preloader click handler
        $(document).on('click', '.cancel-preloader a', function (e) {
            e.preventDefault();
            $("#preloader").fadeOut(2000);
        });
    });

})(jQuery);
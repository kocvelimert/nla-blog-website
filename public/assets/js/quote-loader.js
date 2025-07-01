// Quote Loader for Daily Quote Widget
class QuoteLoader {
  constructor() {
    this.quoteContainer = document.querySelector('.quote-container');
    this.quoteText = document.getElementById('daily-quote');
    this.characterName = document.getElementById('quote-character');
    this.animeName = document.getElementById('quote-anime');
    this.isLoading = false;
    
    console.log('🎯 QuoteLoader initialized');
    console.log('📍 Looking for elements...');
    console.log('Container:', this.quoteContainer);
    console.log('Quote text:', this.quoteText);
    console.log('Character:', this.characterName);
    console.log('Anime:', this.animeName);
    
    console.log('Elements found:', {
      container: !!this.quoteContainer,
      text: !!this.quoteText,
      character: !!this.characterName,
      anime: !!this.animeName
    });
    
    // If elements are not found immediately, try again after a delay
    if (!this.quoteText || !this.characterName || !this.animeName) {
      console.log('⏰ Some elements not found, trying again in 100ms...');
      setTimeout(() => {
        this.refindElements();
      }, 100);
    }
  }
  
  // Try to find elements again
  refindElements() {
    this.quoteContainer = document.querySelector('.quote-container');
    this.quoteText = document.getElementById('daily-quote');
    this.characterName = document.getElementById('quote-character');
    this.animeName = document.getElementById('quote-anime');
    
    console.log('🔍 Refinding elements:', {
      container: !!this.quoteContainer,
      text: !!this.quoteText,
      character: !!this.characterName,
      anime: !!this.animeName
    });
  }

  // Show loading state
  showLoading() {
    if (this.quoteContainer) {
      this.quoteContainer.classList.add('loading');
    }
    this.isLoading = true;
  }

  // Hide loading state
  hideLoading() {
    if (this.quoteContainer) {
      this.quoteContainer.classList.remove('loading');
    }
    this.isLoading = false;
  }

  // Update quote content in DOM
  updateQuoteContent(quote) {
    try {
      console.log('🔄 Updating quote content with:', quote);
      console.log('🎯 DOM elements check:', {
        quoteText: !!this.quoteText,
        characterName: !!this.characterName,
        animeName: !!this.animeName
      });
      
      if (this.quoteText) {
        console.log('📝 Updating quote text:', quote.content);
        this.quoteText.textContent = quote.content;
      } else {
        console.error('❌ Quote text element not found!');
      }
      
      if (this.characterName && quote.character && quote.character.name) {
        console.log('👤 Updating character name:', quote.character.name);
        this.characterName.textContent = quote.character.name;
      } else {
        console.error('❌ Character name element not found or data missing!', {
          element: !!this.characterName,
          data: quote.character
        });
      }
      
      if (this.animeName && quote.anime && quote.anime.name) {
        console.log('🎌 Updating anime name:', quote.anime.name);
        this.animeName.textContent = quote.anime.name;
      } else {
        console.error('❌ Anime name element not found or data missing!', {
          element: !!this.animeName,
          data: quote.anime
        });
      }

      // Update mobile widgets as well
      const mobileQuoteText = document.getElementById('daily-quote-mobile');
      const mobileCharacterName = document.getElementById('quote-character-mobile');
      const mobileAnimeName = document.getElementById('quote-anime-mobile');

      if (mobileQuoteText) {
        console.log('📱 Updating mobile quote text:', quote.content);
        mobileQuoteText.textContent = quote.content;
      }
      
      if (mobileCharacterName && quote.character && quote.character.name) {
        console.log('📱 Updating mobile character name:', quote.character.name);
        mobileCharacterName.textContent = quote.character.name;
      }
      
      if (mobileAnimeName && quote.anime && quote.anime.name) {
        console.log('📱 Updating mobile anime name:', quote.anime.name);
        mobileAnimeName.textContent = quote.anime.name;
      }
      
      console.log('✅ Quote updated successfully!');
    } catch (error) {
      console.error('💥 Error updating quote content:', error);
      console.error('Quote data was:', quote);
    }
  }

  // Fetch daily quote from server
  async fetchDailyQuote() {
    if (this.isLoading) return;

    try {
      this.showLoading();
      
      console.log('Fetching daily quote from server...');
      
      // Add cache-busting parameter to prevent browser caching
      const response = await fetch(`/quotes/daily?t=${Date.now()}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.status === 'success' && data.data) {
        console.log('✅ Valid response received, updating content...');
        this.updateQuoteContent(data.data);
      } else {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('Error fetching daily quote:', error);
      
      // Fallback quote in case of error
      this.updateQuoteContent({
        content: "The only way to truly escape the mundane is to constantly seek the extraordinary.",
        character: { name: "Unknown Character" },
        anime: { name: "Unknown Anime" }
      });
    } finally {
      console.log('🔄 Hiding loading state...');
      this.hideLoading();
    }
  }

  // Force refresh quote (for testing)
  async forceRefresh() {
    try {
      console.log('Force refreshing quote...');
      
      const response = await fetch('/quotes/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Force refresh response:', data);
      
      if (data.status === 'success' && data.data) {
        this.updateQuoteContent(data.data);
      }
      
    } catch (error) {
      console.error('Error force refreshing quote:', error);
    }
  }

  // Initialize quote loader
  init() {
    console.log('🚀 Initializing quote loader...');
    console.log('Document ready state:', document.readyState);
    
    // Load quote when page loads
    if (document.readyState === 'loading') {
      console.log('⏳ Waiting for DOM to load...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM loaded, fetching quote...');
        this.fetchDailyQuote();
      });
    } else {
      console.log('✅ DOM already loaded, fetching quote immediately...');
      this.fetchDailyQuote();
    }
    
    // Add keyboard shortcut for testing (Ctrl+Shift+Q)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        console.log('Manual quote refresh triggered');
        this.forceRefresh();
      }
    });
  }
}

// Wait for everything to be loaded before initializing
function initQuoteLoader() {
  console.log('🚀 Starting quote loader initialization...');
  
  // Wait a bit more to ensure sidebar is loaded
  setTimeout(() => {
    console.log('⏰ Attempting to initialize quote loader...');
    const quoteLoader = new QuoteLoader();
    quoteLoader.init();
    
    // Make it globally accessible for testing
    window.quoteLoader = quoteLoader;
    
    // Also try a direct test
    console.log('🧪 Testing direct element access:');
    const testQuote = document.getElementById('daily-quote');
    const testCharacter = document.getElementById('quote-character');
    const testAnime = document.getElementById('quote-anime');
    
    console.log('Direct test results:', {
      quote: testQuote,
      character: testCharacter,  
      anime: testAnime
    });
    
    if (testQuote) {
      console.log('✅ Found quote element, testing direct update...');
      testQuote.textContent = 'Test quote loaded successfully!';
    } else {
      console.error('❌ Could not find quote element with ID: daily-quote');
    }
  }, 500);
}

// Multiple ways to ensure initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuoteLoader);
} else {
  initQuoteLoader();
}

// Also try on window load as backup
window.addEventListener('load', () => {
  console.log('🌍 Window loaded, checking if quote loader exists...');
  if (!window.quoteLoader) {
    console.log('🔄 Quote loader not found, initializing again...');
    initQuoteLoader();
  }
}); 
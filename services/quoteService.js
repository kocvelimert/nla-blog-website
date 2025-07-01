const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class QuoteService {
  constructor() {
    this.quotePath = path.join(__dirname, '../data/quote.json');
    this.animechanUrl = process.env.ANIMECHAN_URL || 'https://api.animechan.io/v1/quotes/random';
    console.log('🔧 Using API URL:', this.animechanUrl);
  }

  // Check if 24 hours have passed since last update
  async needsUpdate() {
    try {
      const data = await this.getStoredQuote();
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
      
      return hoursDiff >= 24;
    } catch (error) {
      console.error('Error checking if quote needs update:', error);
      return true; // If error, assume we need update
    }
  }

  // Get stored quote from file
  async getStoredQuote() {
    try {
      const data = await fs.readFile(this.quotePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading stored quote:', error);
      // Return default quote if file doesn't exist or is corrupted
      return {
        lastUpdated: "2023-01-01T00:00:00.000Z",
        quote: {
          content: "Whenever I counted on someone, I ended up getting hurt.",
          anime: {
            id: 2,
            name: "Hanasaku Iroha"
          },
          character: {
            id: 5,
            name: "Ohana Matsumae"
          }
        }
      };
    }
  }

  // Fetch new quote from API
  async fetchNewQuote() {
    return new Promise((resolve) => {
      const url = this.animechanUrl; // Use the full URL directly
      
      console.log('🌐 Fetching from URL:', url);
      
      https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            
            // Check if we got valid data
            if (jsonData.status === 'success' && jsonData.data) {
              resolve(jsonData.data);
            } else {
              throw new Error('Invalid API response format');
            }
          } catch (error) {
            console.error('Error parsing API response:', error);
            // Return fallback quote if API fails
            resolve({
              content: "The only way to truly escape the mundane is to constantly seek the extraordinary.",
              anime: {
                id: 1,
                name: "Unknown Anime"
              },
              character: {
                id: 1,
                name: "Unknown Character"
              }
            });
          }
        });
      }).on('error', (error) => {
        console.error('Error fetching new quote from API:', error);
        // Return fallback quote if API fails
        resolve({
          content: "The only way to truly escape the mundane is to constantly seek the extraordinary.",
          anime: {
            id: 1,
            name: "Unknown Anime"
          },
          character: {
            id: 1,
            name: "Unknown Character"
          }
        });
      });
    });
  }

  // Store quote in file
  async storeQuote(quote) {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        quote: quote
      };
      
      await fs.writeFile(this.quotePath, JSON.stringify(data, null, 2));
      console.log('Quote stored successfully');
      return data;
    } catch (error) {
      console.error('Error storing quote:', error);
      throw error;
    }
  }

  // Main method to get daily quote (with auto-refresh logic)
  async getDailyQuote() {
    try {
      const storedData = await this.getStoredQuote();
      const lastUpdated = new Date(storedData.lastUpdated);
      const now = new Date();
      const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
      
      console.log(`Quote last updated: ${lastUpdated.toISOString()}`);
      console.log(`Current time: ${now.toISOString()}`);
      console.log(`Hours since last update: ${hoursDiff.toFixed(2)}`);
      
      const needsUpdate = await this.needsUpdate();
      console.log(`Needs update: ${needsUpdate}`);
      
      if (needsUpdate) {
        console.log('🔄 Fetching new daily quote from API...');
        const newQuote = await this.fetchNewQuote();
        console.log('✅ New quote fetched:', newQuote);
        const savedData = await this.storeQuote(newQuote);
        console.log('💾 Quote saved to file:', savedData.lastUpdated);
        return newQuote;
      } else {
        console.log('📚 Using cached daily quote...');
        return storedData.quote;
      }
    } catch (error) {
      console.error('❌ Error getting daily quote:', error);
      // Fallback to stored quote if everything fails
      const storedData = await this.getStoredQuote();
      return storedData.quote;
    }
  }

  // Force refresh quote (for testing or manual refresh)
  async forceRefresh() {
    console.log('Force refreshing daily quote...');
    const newQuote = await this.fetchNewQuote();
    await this.storeQuote(newQuote);
    return newQuote;
  }
}

module.exports = new QuoteService(); 
import axios from 'axios';

// Create axios instance for API
const nightvaleApi = axios.create({
  baseURL: 'http://localhost:5000/api/proxy',
  timeout: 30000,
  withCredentials: true,  // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Create a custom event for auth state changes
export const authStateChanged = new EventTarget();

// Initialize credentials from backend
export const initializeCredentials = async () => {
  try {
    // First try to get credentials from localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedWallet = localStorage.getItem('walletAddress');

    if (storedToken && storedWallet) {
      // Clean token and set headers
      const cleanToken = storedToken.replace('Bearer ', '').trim();
      nightvaleApi.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
      nightvaleApi.defaults.headers.common['x-selected-wallet-address'] = storedWallet.trim();
      return true;
    }

    // If no stored credentials, try to get from backend
    const response = await axios.get('http://localhost:5000/api/credentials', {
      withCredentials: true
    });
    
    if (response.data.token && response.data.walletAddress) {
      // Clean token and set headers
      const cleanToken = response.data.token.replace('Bearer ', '').trim();
      nightvaleApi.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
      nightvaleApi.defaults.headers.common['x-selected-wallet-address'] = response.data.walletAddress.trim();

      // Store clean credentials in secure localStorage
      try {
        localStorage.setItem('auth_token', cleanToken);
        localStorage.setItem('walletAddress', response.data.walletAddress.trim());
      } catch (e) {
        console.error('Error storing credentials:', e);
        // Continue even if storage fails
      }
      return true;
    }
    throw new Error('Missing credentials from backend');
  } catch (error) {
    console.error('Error initializing credentials:', error);
    throw error;
  }
};

// Add request interceptor to ensure headers are set
nightvaleApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage if not in headers
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Make sure token has Bearer prefix
      const cleanToken = token.replace('Bearer ', '').trim();
      config.headers['Authorization'] = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
    }

    // Get wallet address from localStorage if not in headers
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      config.headers['x-selected-wallet-address'] = walletAddress.trim();
    }

    // Log sanitized headers for debugging
    console.log('Request headers:', {
      'Authorization': config.headers['Authorization'] ? '**********' : null,
      'x-selected-wallet-address': config.headers['x-selected-wallet-address'] ? '**********' : null
    });

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
nightvaleApi.interceptors.response.use(
  (response) => {
    // Only log status, not sensitive data
    console.log('Response status:', response.status);
    return response;
  },
  async (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // Clear stored credentials
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('walletAddress');
        delete nightvaleApi.defaults.headers.common['Authorization'];
        delete nightvaleApi.defaults.headers.common['x-selected-wallet-address'];
      } catch (e) {
        console.error('Error clearing credentials:', e);
      }

      // Dispatch auth state change event
      authStateChanged.dispatchEvent(new CustomEvent('changed', { 
        detail: { isAuthenticated: false, walletAddress: null }
      }));
    }
    return Promise.reject(error);
  }
);

// API functions
export const getUserStats = async () => {
  try {
    const response = await nightvaleApi.get('/user/achievement-stat/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

export const getGoldStats = async () => {
  try {
    const response = await nightvaleApi.get('/user/gold-stat/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching gold stats:', error);
    throw error;
  }
};

export const getTotalEarnings = async () => {
  try {
    const response = await fetch('/data/achievement_stats.json');
    if (!response.ok) {
      throw new Error('Failed to load achievement stats');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading achievement stats:', error);
    throw error;
  }
};

export const getFungibleBalances = async () => {
  try {
    const response = await fetch('/data/fungible_balances.json');
    if (!response.ok) {
      throw new Error('Failed to load fungible balances');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading fungible balances:', error);
    throw error;
  }
};

export const getDungeonDefinitions = async () => {
  try {
    const response = await fetch('/data/dungeon_definitions.json');
    if (!response.ok) {
      throw new Error('Failed to load dungeon definitions');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading dungeon definitions:', error);
    throw error;
  }
};

export const getInventoryItems = async () => {
  try {
    const response = await fetch('/data/inventory_items.json');
    if (!response.ok) {
      throw new Error('Failed to load inventory items');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading inventory items:', error);
    throw error;
  }
};

export const getRecentQuestClaims = async () => {
  try {
    const response = await fetch('/data/recent_quest_claims.json');
    if (!response.ok) {
      throw new Error('Failed to load recent quest claims');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading recent quest claims:', error);
    throw error;
  }
};

export const getRecentTripRewards = async () => {
  try {
    const response = await fetch('/data/recent_trip_rewards.json');
    if (!response.ok) {
      throw new Error('Failed to load recent trip rewards');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading recent trip rewards:', error);
    throw error;
  }
};

export const getRecentExchanges = async () => {
  try {
    const response = await fetch('/data/recent_exchanges.json');
    if (!response.ok) {
      throw new Error('Failed to load recent exchanges');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading recent exchanges:', error);
    throw error;
  }
};

export const getDropChances = async () => {
  try {
    const response = await fetch('/data/drop_chances.json');
    if (!response.ok) {
      throw new Error('Failed to load drop chances');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error loading drop chances:', error);
    throw error;
  }
};

export const getDungeonDropChances = async (nftClass) => {
  try {
    const response = await nightvaleApi.get(`/dungeon/base-item-drop-chances?class=${nftClass.toLowerCase()}`);
    return response.data;
  } catch (error) {
    console.error('Error loading dungeon drop chances:', error);
    throw error;
  }
};

export const getNFTData = async () => {
  try {
    const response = await nightvaleApi.get('/nft/info');
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT data:', error);
    throw error;
  }
};

export const getLootExchangeOffers = async () => {
  try {
    const response = await nightvaleApi.get('/loot-exchange/all-offers');
    return response.data;
  } catch (error) {
    console.error('Error fetching loot exchange offers:', error);
    throw error;
  }
};

export const getInventory = async () => {
  try {
    const response = await nightvaleApi.get('/inventory/items');
    return response.data;
  } catch (error) {
    console.error('Error loading inventory:', error);
    throw error;
  }
};

export const setManualBearerToken = async (token, walletAddress) => {
  try {
    if (!token || !walletAddress) {
      throw new Error('Token and wallet address are required');
    }

    // Clean and validate token and wallet address
    let cleanToken = token.trim();
    // Keep the Bearer prefix if it exists in the input
    if (!cleanToken.startsWith('Bearer ')) {
      cleanToken = `Bearer ${cleanToken}`;
    }
    const cleanWallet = walletAddress.trim();

    if (!cleanToken || !cleanWallet) {
      throw new Error('Invalid token or wallet address');
    }
    
    console.log('Setting credentials...');
    
    // Store the token exactly as it will be used
    try {
      localStorage.setItem('auth_token', cleanToken);
      localStorage.setItem('walletAddress', cleanWallet);
    } catch (e) {
      console.error('Error storing credentials:', e);
      // Continue even if storage fails
    }

    // Set headers for future requests - use the exact same format
    nightvaleApi.defaults.headers.common['Authorization'] = cleanToken;
    nightvaleApi.defaults.headers.common['x-selected-wallet-address'] = cleanWallet;

    // Dispatch auth state change event immediately
    authStateChanged.dispatchEvent(new CustomEvent('changed', { 
      detail: { isAuthenticated: true, walletAddress: cleanWallet }
    }));
    return true;

  } catch (error) {
    console.error('Error setting credentials:', error);
    // Clear any partially set credentials
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('walletAddress');
      delete nightvaleApi.defaults.headers.common['Authorization'];
      delete nightvaleApi.defaults.headers.common['x-selected-wallet-address'];
    } catch (e) {
      console.error('Error clearing credentials:', e);
    }
    
    authStateChanged.dispatchEvent(new CustomEvent('changed', { 
      detail: { isAuthenticated: false, walletAddress: null }
    }));
    throw error;
  }
};

export default nightvaleApi; 
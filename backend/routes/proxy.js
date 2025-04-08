const express = require('express');
const axios = require('axios');
const router = express.Router();

// Create an axios instance for the Nightvale API
const nightvaleApi = axios.create({
  baseURL: 'https://api-production.defidungeons.gg',
  headers: {
    'Origin': 'https://dungeons.game',
    'Referer': 'https://dungeons.game/'
  }
});

// Proxy all requests
router.all('/*', async (req, res) => {
  try {
    // Get the path from the request
    const path = req.params[0];
    
    // Get token and wallet address from environment variables
    const token = process.env.BEARER_TOKEN;
    const walletAddress = process.env.WALLET_ADDRESS;

    // Forward the request to Nightvale API
    const response = await nightvaleApi({
      method: req.method,
      url: path,
      data: req.body,
      headers: {
        ...req.headers,
        'Authorization': token,
        'x-selected-wallet-address': walletAddress,
        'Origin': 'https://dungeons.game',
        'Referer': 'https://dungeons.game/',
        'host': 'api-production.defidungeons.gg'
      },
      params: req.query
    });

    // Send back the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();

// Get credentials from environment variables
router.get('/credentials', (req, res) => {
  const token = process.env.BEARER_TOKEN;
  const walletAddress = process.env.WALLET_ADDRESS;

  if (!token || !walletAddress) {
    return res.status(500).json({ 
      message: 'Server configuration error: Missing environment variables' 
    });
  }

  res.json({
    token,
    walletAddress
  });
});

module.exports = router; 
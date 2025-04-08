# Defi Dungeons ROI Calculator

This calculator helps track and predict Return on Investment (ROI) for Defi Dungeons assets on the Solana blockchain.

## Features

- Track NFT floor price from Magic Eden
- Monitor Gold token price
- Record daily gold earnings
- Predict ROI using machine learning
- Generate visual reports of earnings over time

## Setup

1. Install Python 3.8 or higher
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the calculator:
```bash
python defi_dungeon_calculator.py
```

The calculator provides three main options:
1. Add daily gold earnings
2. Generate ROI report
3. Exit

### Adding Daily Gold Earnings
When prompted, enter:
- Date in YYYY-MM-DD format
- Amount of gold earned that day

### ROI Report
The report includes:
- Current value of your investment
- ROI percentage
- Predicted days to break even
- Visual plot of gold earnings over time

## Data Storage
Daily gold earnings are stored in `gold_earnings.json`. The file is automatically created when you first add earnings data.

## API Integration
The calculator uses:
- Jupiter API for token prices
- Magic Eden API for NFT floor prices

## Initial Investment
The calculator assumes an initial investment of $425:
- $325 for the NFT
- $100 for the Gold token 
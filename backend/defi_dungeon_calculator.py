import requests
import json
from datetime import datetime, timedelta
import os
import sqlite3
import time
from dungeon_strategy import DungeonStrategy

class DefiDungeonCalculator:
    def __init__(self):
        self.gold_earnings = []
        self.price_cache = {
            'gold': {'price': 0, 'timestamp': None},
            'nft': {'price': 0, 'timestamp': None}
        }
        self.initial_investment = 425  # USDC
        self.db_path = 'defi_dungeons.db'
        self.birdeye_api_key = os.getenv('BIRDEYE_API_KEY', '')
        self.magic_eden_api_key = os.getenv('MAGIC_EDEN_API_KEY', '')
        self.strategy = DungeonStrategy()  # Initialize with default stats
        self.setup_database()
        
    def setup_database(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Create tables if they don't exist
        c.execute('''
            CREATE TABLE IF NOT EXISTS gold_earnings (
                date TEXT PRIMARY KEY,
                gold_amount REAL,
                source TEXT
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS inventory (
                name TEXT,
                rarity TEXT,
                tier INTEGER,
                quantity INTEGER,
                current_price REAL,
                PRIMARY KEY (name, tier)
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS price_history (
                timestamp TEXT PRIMARY KEY,
                gold_price REAL,
                nft_price REAL
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS gear (
                slot TEXT PRIMARY KEY,
                name TEXT,
                rarity TEXT,
                tier INTEGER
            )
        ''')
        
        conn.commit()
        conn.close()

    def get_gold_token_price(self):
        try:
            # Check cache first
            if self.price_cache['gold']['timestamp'] and \
               (datetime.now() - self.price_cache['gold']['timestamp']).total_seconds() < 300:
                return self.price_cache['gold']['price']

            # Try Birdeye API
            url = "https://public-api.birdeye.so/public/price?address=GLDuCvYo2Qf9qQ4QyPEyR8yD7YXJeNRGk6RKTnkdXZz4"
            headers = {
                'X-API-KEY': self.birdeye_api_key,
                'Accept': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                price = data.get('data', {}).get('value', 0)
                if price > 0:
                    self.price_cache['gold']['price'] = price
                    self.price_cache['gold']['timestamp'] = datetime.now()
                    return price

            # Fallback to default price if API fails
            return 0.025
            
        except Exception as e:
            print(f"Error fetching GOLD price: {e}")
            return self.price_cache['gold']['price'] or 0.1

    def get_nft_price(self):
        try:
            # Check cache first
            if self.price_cache['nft']['timestamp'] and \
               (datetime.now() - self.price_cache['nft']['timestamp']).total_seconds() < 300:
                return self.price_cache['nft']['price']

            # Try Magic Eden API
            url = "https://api-mainnet.magiceden.dev/v2/collections/defi-dungeons/stats"
            headers = {
                'Authorization': f'Bearer {self.magic_eden_api_key}',
                'Accept': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            if data.get('floorPrice'):
                price = data['floorPrice'] / 1e9  # Convert from lamports to SOL
                self.price_cache['nft']['price'] = price
                self.price_cache['nft']['timestamp'] = datetime.now()
                return price

            # Fallback to default price if API fails
            return 0.5
            
        except Exception as e:
            print(f"Error fetching NFT price: {e}")
            return self.price_cache['nft']['price'] or 0.5

    def add_daily_gold_earnings(self, date, gold_amount, source='Quest'):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            c.execute('''
                INSERT OR REPLACE INTO gold_earnings (date, gold_amount, source)
                VALUES (?, ?, ?)
            ''', (date, gold_amount, source))
            conn.commit()
        except Exception as e:
            print(f"Error adding gold earnings: {e}")
        finally:
            conn.close()

    def get_gold_earnings(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            c.execute('SELECT date, gold_amount, source FROM gold_earnings ORDER BY date DESC')
            rows = c.fetchall()
            return [{'date': row[0], 'gold_amount': row[1], 'source': row[2]} for row in rows]
        except Exception as e:
            print(f"Error fetching gold earnings: {e}")
            return []
        finally:
            conn.close()

    def calculate_current_value(self):
        gold_price = self.get_gold_token_price()
        total_gold = sum(entry['gold_amount'] for entry in self.get_gold_earnings())
        return total_gold * gold_price

    def predict_roi(self):
        current_value = self.calculate_current_value()
        earnings = self.get_gold_earnings()
        
        if not earnings:
            return {'days': float('inf'), 'confidence': 'LOW'}
            
        # Calculate daily average from the last 7 days
        recent_earnings = earnings[:7]
        if not recent_earnings:
            return {'days': float('inf'), 'confidence': 'LOW'}
            
        daily_average = sum(entry['gold_amount'] for entry in recent_earnings) / len(recent_earnings)
        
        if daily_average <= 0:
            return {'days': float('inf'), 'confidence': 'LOW'}
            
        remaining_to_roi = max(0, self.initial_investment - current_value)
        days_to_roi = remaining_to_roi / (daily_average * self.get_gold_token_price())
        
        # Calculate confidence based on data consistency
        earnings_std = (sum((entry['gold_amount'] - daily_average) ** 2 for entry in recent_earnings) / len(recent_earnings)) ** 0.5
        confidence = 'HIGH' if earnings_std < daily_average * 0.2 else 'MEDIUM' if earnings_std < daily_average * 0.5 else 'LOW'
        
        return {
            'days': days_to_roi,
            'confidence': confidence
        }

    def calculate_24h_change(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            # Get current price
            current_price = self.get_gold_token_price()
            
            # Get price from 24 hours ago
            c.execute('''
                SELECT gold_price FROM price_history
                WHERE timestamp < datetime('now', '-24 hours')
                ORDER BY timestamp DESC
                LIMIT 1
            ''')
            result = c.fetchone()
            conn.close()
            
            if not result or not current_price:
                return 0
                
            old_price = result[0]
            if old_price == 0:
                return 0
                
            return ((current_price - old_price) / old_price) * 100
            
        except Exception as e:
            print(f"Error calculating 24h change: {e}")
            return 0

    def update_inventory(self, name, rarity, tier, quantity, current_price):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            c.execute('''
                INSERT OR REPLACE INTO inventory (name, rarity, tier, quantity, current_price)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, rarity, tier, quantity, current_price))
            conn.commit()
        except Exception as e:
            print(f"Error updating inventory: {e}")
        finally:
            conn.close()

    def get_inventory(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            c.execute('SELECT name, rarity, tier, quantity, current_price FROM inventory')
            rows = c.fetchall()
            return [{
                'name': row[0],
                'rarity': row[1],
                'tier': row[2],
                'quantity': row[3],
                'current_price': row[4]
            } for row in rows]
        except Exception as e:
            print(f"Error fetching inventory: {e}")
            return []
        finally:
            conn.close()

    def get_market_analysis(self):
        try:
            # Get current gold price
            gold_price = self.get_gold_token_price()
            
            # Get inventory for market analysis
            inventory = self.get_inventory()
            
            # Calculate market trend
            market_change = self.calculate_24h_change()
            market_trend = "UP" if market_change > 0 else "DOWN" if market_change < 0 else "STABLE"
            
            # Prepare market data
            market_data = {
                'items': [],
                'gold_price_usd': gold_price,
                'market_trend': market_trend,
                'market_change_24h': market_change
            }
            
            # Add all items from market data with their predefined prices
            for item_name, item_data in self.strategy.market_data['items'].items():
                # Find if we have this item in inventory
                inventory_item = next((item for item in inventory if item['name'] == item_name), None)
                
                market_data['items'].append({
                    'name': item_name,
                    'rarity': item_data['rarity'],
                    'tier': item_data.get('tier', 0),
                    'current_price': item_data['price'],
                    'weight': item_data['weight'],
                    'source': item_data['source'],
                    'quantity': inventory_item['quantity'] if inventory_item else 0,
                    'trend': market_trend
                })
            
            return market_data
        except Exception as e:
            print(f"Error in market analysis: {e}")
            return None

    def get_sell_recommendations(self):
        try:
            recommendations = []
            inventory = self.get_inventory()
            
            for item in inventory:
                item_data = self.strategy.market_data['items'].get(item['name'])
                if item_data:
                    # Get market timing recommendations
                    timing_recs = self.strategy.analyze_market_timing(
                        item['name'],
                        item['current_price'],
                        item_data['weight'],
                        item_data['source'],
                        item_data.get('tier')
                    )
                    
                    # Get price efficiency recommendations
                    efficiency_recs = self.strategy.analyze_price_efficiency()
                    
                    # Combine recommendations
                    item_recommendations = timing_recs + efficiency_recs
                    if item_recommendations:
                        recommendations.append({
                            'item_name': item['name'],
                            'recommendations': item_recommendations
                        })
            
            return recommendations
        except Exception as e:
            print(f"Error getting sell recommendations: {e}")
            return [] 
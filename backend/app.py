from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import requests
import os
from dotenv import load_dotenv
import time

app = Flask(__name__)

# Security configurations (Simplified - consider re-adding CSRF if forms are used)
# app.config.update(
#     SESSION_COOKIE_SECURE=True,
#     SESSION_COOKIE_HTTPONLY=True,
#     SESSION_COOKIE_SAMESITE='Lax',
#     PERMANENT_SESSION_LIFETIME=timedelta(minutes=30)
# )
# app.secret_key = secrets.token_hex(32)

# Whitelist of allowed origins
ALLOWED_ORIGINS = ['http://localhost:3000']

# Configure CORS
CORS(app, 
     resources={
         r"/*": {
             "origins": ALLOWED_ORIGINS,
             "methods": ["GET", "OPTIONS"], # Simplified methods
             "allow_headers": ["Content-Type"], # Simplified headers
             "supports_credentials": True,
             "send_wildcard": False,
             "max_age": 3600
         }
     })

# Security headers middleware (Simplified CSP)
@app.after_request
def add_security_headers(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        if request.method == 'OPTIONS':
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Access-Control-Max-Age'] = '3600'
    
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    # response.headers['Content-Security-Policy'] = "default-src 'self' http://localhost:3000" # Consider adjusting if needed
    
    return response

# Removed CSRF/origin validation functions as they aren't used with simple GET endpoints

# Load environment variables
load_dotenv()

# Database path
DB_PATH = 'defi_dungeons.db'

# --- Price Caches ---
PRICE_CACHE = { 'price': None, 'timestamp': None, 'cache_duration': timedelta(minutes=5) }
NFT_PRICE_CACHE = { 'price': None, 'timestamp': None, 'cache_duration': timedelta(minutes=5) }
SOL_PRICE_CACHE = { 'price': None, 'timestamp': None, 'cache_duration': timedelta(minutes=1) }

# --- Predefined Loot (Used only for DB init) ---
PREDEFINED_LOOT = { 
    'quest': {
        'grey': [
            {'name': 'Wooden Torch', 'price': 4.9, 'weight': 1},
            {'name': 'Broken Skull', 'price': 9.7, 'weight': 1},
            {'name': 'Old World Map', 'price': 16.2, 'weight': 1},
            {'name': 'Wooden Crate', 'price': 81.0, 'weight': 1}
        ],
        'green': [
            {'name': 'Tome of Knowledge', 'price': 6.5, 'weight': 2},
            {'name': 'Giant Beetle Shell', 'price': 13.5, 'weight': 2},
            {'name': 'Travelers Satchel', 'price': 32.4, 'weight': 2},
            {'name': 'Elemental Stone', 'price': 129.6, 'weight': 2}
        ],
        'blue': [
            {'name': 'Blood Elixir', 'price': 9.7, 'weight': 4},
            {'name': 'Golden Chalice', 'price': 19.4, 'weight': 4},
            {'name': 'Mirror of Memories', 'price': 40.5, 'weight': 4},
            {'name': 'Crystal Ball', 'price': 194.4, 'weight': 4}
        ],
        'purple': [
            {'name': 'Shiny Band', 'price': 13.0, 'weight': 8},
            {'name': 'Phoenix Feather', 'price': 25.9, 'weight': 8},
            {'name': 'Dragon Scale', 'price': 58.7, 'weight': 8},
            {'name': 'Giant Gold Coin Chest', 'price': 283.5, 'weight': 8}
        ],
        'gold': [
            {'name': 'Gem of the lost king', 'price': 16.2, 'weight': 16},
            {'name': 'Crown Jewel', 'price': 32.4, 'weight': 16},
            {'name': 'Kings Diamond', 'price': 81.0, 'weight': 16},
            {'name': 'Ring of the True King', 'price': 405.0, 'weight': 16}
        ]
    },
    'dungeon': {
        'grey': [
            {'name': 'Wolfs Head', 'price': 16.2, 'weight': 1, 'tier': 1},
            {'name': 'Wraiths Soul', 'price': 24.3, 'weight': 1, 'tier': 2},
            {'name': 'Bandit Skull', 'price': 32.4, 'weight': 1, 'tier': 3},
            {'name': 'Frozen Heart', 'price': 40.5, 'weight': 1, 'tier': 4},
            {'name': 'Inquisters Trinket', 'price': 64.5, 'weight': 1, 'tier': 5}
        ],
        'green': [
            {'name': 'Wolfs Claw', 'price': 8.2, 'weight': 2, 'tier': 1},
            {'name': 'Ancient Cloak', 'price': 13.0, 'weight': 2, 'tier': 2},
            {'name': 'Bandit Mask', 'price': 16.2, 'weight': 2, 'tier': 3},
            {'name': 'Frozen Tear', 'price': 19.4, 'weight': 2, 'tier': 4},
            {'name': 'Inquisters Orb', 'price': 56.7, 'weight': 2, 'tier': 5}
        ],
        'blue': [
            {'name': 'Pristine Pelt', 'price': 19.4, 'weight': 4, 'tier': 1},
            {'name': 'Ancient Pendant', 'price': 25.9, 'weight': 4, 'tier': 2},
            {'name': 'Bandit Heart', 'price': 40.5, 'weight': 4, 'tier': 3},
            {'name': 'Ice Crown', 'price': 48.6, 'weight': 4, 'tier': 4},
            {'name': 'Inquistors Book', 'price': 24.3, 'weight': 4, 'tier': 5}
        ],
        'purple': [
            {'name': 'Wooden Casket', 'price': 32.4, 'weight': 8, 'tier': 1},
            {'name': 'Enchanted Urn', 'price': 58.7, 'weight': 8, 'tier': 2},
            {'name': 'Bankers Briefcase', 'price': 81.0, 'weight': 8, 'tier': 3},
            {'name': 'Frozen Coffer', 'price': 81.0, 'weight': 8, 'tier': 4},
            {'name': 'Lost Runepouch', 'price': 121.5, 'weight': 8, 'tier': 5}
        ],
        'gold': [
            {'name': 'Adventurers Pouch', 'price': 121.5, 'weight': 16, 'tier': 1},
            {'name': 'Ancient Relic', 'price': 178.2, 'weight': 16, 'tier': 2},
            {'name': 'Stolen Treasure', 'price': 243.0, 'weight': 16, 'tier': 3},
            {'name': 'Cursed Medallion', 'price': 364.5, 'weight': 16, 'tier': 4},
            {'name': 'Void Inscription', 'price': 486.0, 'weight': 16, 'tier': 5}
        ]
    }
}

# Removed Nightvale constants and related functions

# --- Database Functions ---

def check_db_exists():
    try:
        conn = get_db_connection()
        if conn is None: return False
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(inventory)")
        columns = {row[1] for row in cursor.fetchall()}
        required_columns = {'name', 'quantity', 'rarity', 'source', 'current_price', 'weight', 'tier'}
        if not required_columns.issubset(columns):
            print("Inventory table missing required columns")
            conn.close(); return False
        required_tables = ['gold_earnings', 'price_history', 'base_loot_prices', 'base_price_history', 'gold_price_history']
        for table in required_tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not cursor.fetchone():
                print(f"{table} table not found")
                conn.close(); return False
        conn.close(); return True
    except Exception as e:
        print(f"Error checking database: {str(e)}"); return False

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn is None: return False
    try:
        cursor = conn.cursor()
        cursor.execute(''' CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, quantity INTEGER NOT NULL, rarity TEXT NOT NULL, source TEXT NOT NULL, current_price REAL NOT NULL, weight REAL NOT NULL DEFAULT 1.0, tier INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ''')
        cursor.execute(''' CREATE TABLE IF NOT EXISTS price_history (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, price REAL NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (item_id) REFERENCES inventory(id)) ''')
        cursor.execute(''' CREATE TABLE IF NOT EXISTS base_loot_prices (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, source TEXT NOT NULL, rarity TEXT NOT NULL, base_price REAL NOT NULL, weight REAL NOT NULL, tier INTEGER, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(name, source, rarity)) ''')
        cursor.execute(''' CREATE TABLE IF NOT EXISTS base_price_history (id INTEGER PRIMARY KEY AUTOINCREMENT, base_loot_id INTEGER NOT NULL, price REAL NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (base_loot_id) REFERENCES base_loot_prices(id)) ''')
        cursor.execute(''' CREATE TABLE IF NOT EXISTS gold_earnings (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, amount REAL NOT NULL, source TEXT DEFAULT 'Quest', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ''')
        cursor.execute(''' CREATE TABLE IF NOT EXISTS gold_price_history (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, price REAL NOT NULL) ''')
        # Removed: gear, equipped_gear, base_stats

        # Keep initial base loot prices insertion
        cursor.execute('SELECT COUNT(*) FROM base_loot_prices')
        if cursor.fetchone()[0] == 0:
            for source, rarities in PREDEFINED_LOOT.items():
                for rarity, items in rarities.items():
                    for item in items:
                        cursor.execute(''' INSERT INTO base_loot_prices (name, source, rarity, base_price, weight, tier) VALUES (?, ?, ?, ?, ?, ?) ''', (item['name'], source, rarity, item['price'], item['weight'], item.get('tier')))
                        base_loot_id = cursor.lastrowid
                        cursor.execute(''' INSERT INTO base_price_history (base_loot_id, price) VALUES (?, ?) ''', (base_loot_id, item['price']))
        conn.commit(); return True
    except Exception as e:
        print(f"Error initializing database: {str(e)}"); return False
    finally:
        if conn: conn.close()

# --- Cache Helper Functions ---
# (get_cached_gold_price, update_gold_price_cache, etc. kept as is)
def get_cached_gold_price():
    """Get GOLD price from cache if valid"""
    if PRICE_CACHE['timestamp'] and PRICE_CACHE['price'] is not None:
        age = datetime.now() - PRICE_CACHE['timestamp']
        if age < PRICE_CACHE['cache_duration']:
            return PRICE_CACHE['price']
    return None

def update_gold_price_cache(price):
    """Update the GOLD price cache"""
    PRICE_CACHE['price'] = price
    PRICE_CACHE['timestamp'] = datetime.now()

def get_cached_nft_price():
    """Get NFT price (SOL) from cache if valid"""
    if NFT_PRICE_CACHE['timestamp'] and NFT_PRICE_CACHE['price'] is not None:
        age = datetime.now() - NFT_PRICE_CACHE['timestamp']
        if age < NFT_PRICE_CACHE['cache_duration']:
            return NFT_PRICE_CACHE['price']
    return None

def update_nft_price_cache(price):
    """Update the NFT price (SOL) cache"""
    NFT_PRICE_CACHE['price'] = price
    NFT_PRICE_CACHE['timestamp'] = datetime.now()

def get_cached_sol_price():
    """Get SOL price (USD) from cache if valid"""
    if SOL_PRICE_CACHE['timestamp'] and SOL_PRICE_CACHE['price'] is not None:
        age = datetime.now() - SOL_PRICE_CACHE['timestamp']
        if age < SOL_PRICE_CACHE['cache_duration']:
            return SOL_PRICE_CACHE['price']
    return None

def update_sol_price_cache(price):
    """Update the SOL price (USD) cache"""
    SOL_PRICE_CACHE['price'] = price
    SOL_PRICE_CACHE['timestamp'] = datetime.now()


# --- Price Fetching Functions ---
# (get_solana_price, get_nft_floor_price, get_gold_token_price, get_db_price kept as is)
def get_solana_price(force_refresh=False):
    """Get current Solana price (USD) from cache or Birdeye API"""
    try:
        if not force_refresh:
            cached_price = get_cached_sol_price()
            if cached_price is not None: return cached_price
        api_key = os.getenv('BIRDEYE_API_KEY')
        if not api_key: return SOL_PRICE_CACHE['price'] 
        sol_address = "So11111111111111111111111111111111111111112"
        url = f"https://public-api.birdeye.so/defi/price?address={sol_address}"
        headers = { "accept": "application/json", "x-chain": "solana", "X-API-KEY": api_key }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data.get('success') and data.get('data') and 'value' in data['data']:
            price = data['data']['value']
            if price is not None and price > 0:
                update_sol_price_cache(price)
                return price
        return SOL_PRICE_CACHE['price']
    except Exception as e:
        print(f"Error fetching SOL price: {e}")
        return SOL_PRICE_CACHE['price']

def get_nft_floor_price(force_refresh=False):
    """Get current NFT floor price (in SOL) from cache or Magic Eden API""" 
    try:
        if not force_refresh:
            cached_price = get_cached_nft_price()
            if cached_price is not None: return cached_price
        url = "https://api-mainnet.magiceden.dev/v2/collections/defi_dungeons/stats" 
        headers = { 'Accept': 'application/json' }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() 
        data = response.json()
        if data.get('floorPrice'):
            price_sol = data['floorPrice'] / 1e9 
            update_nft_price_cache(price_sol)
            return price_sol
        return NFT_PRICE_CACHE['price']
    except Exception as e:
        print(f"Error fetching NFT price (SOL): {e}")
        return NFT_PRICE_CACHE['price']

def get_gold_token_price(force_refresh=False):
    """Get current gold token price from cache, API, or database"""
    try:
        if not force_refresh:
            cached_price = get_cached_gold_price()
            if cached_price is not None: return cached_price
        api_key = os.getenv('BIRDEYE_API_KEY')
        if not api_key: return get_db_price() or 0.1
        gold_address = "GoLDDDNBPD72mSCYbC75GoFZ1e97Uczakp8yNi7JHrK4"
        url = f"https://public-api.birdeye.so/defi/price?address={gold_address}"
        headers = { "accept": "application/json", "x-chain": "solana", "X-API-KEY": api_key }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data.get('success') and data.get('data') and 'value' in data['data']:
            price = data['data']['value']
            if price is not None and price > 0:
                update_gold_price_cache(price)
                conn = get_db_connection()
                if conn:
                    try:
                        c = conn.cursor()
                        c.execute('INSERT INTO gold_price_history (timestamp, price) VALUES (?, ?)', (datetime.now().isoformat(), price))
                        conn.commit()
                    except Exception as db_err: print(f"DB Error storing GOLD price: {db_err}")
                    finally: conn.close()
                return price
        return get_db_price() or 0.1
    except Exception as e:
        print(f"Error fetching GOLD price: {e}")
        return get_db_price() or 0.1

def get_db_price():
    """Get the most recent GOLD price from database"""
    try:
        conn = get_db_connection()
        if conn:
            c = conn.cursor()
            c.execute('''
                SELECT price 
                FROM gold_price_history 
                ORDER BY timestamp DESC 
                LIMIT 1
            ''')
            result = c.fetchone()
            conn.close()
            if result: return result[0]
    except Exception as e: print(f"Error getting GOLD price from database: {e}")
    return None

# --- Kept Endpoints ---

@app.route('/nft/price', methods=['GET'])
def nft_price():
    """Get current NFT floor price in USD"""
    try:
        nft_price_sol = get_nft_floor_price() 
        sol_price_usd = get_solana_price()
        if nft_price_sol is not None and sol_price_usd is not None:
            nft_price_usd = nft_price_sol * sol_price_usd
            return jsonify({
                'price': nft_price_usd,
                'price_sol': nft_price_sol,
                'sol_usd': sol_price_usd,
                'timestamp': NFT_PRICE_CACHE['timestamp'].isoformat() if NFT_PRICE_CACHE['timestamp'] else None,
            })
        else:
            return jsonify({'error': 'Failed to calculate NFT price in USD', 'price': None}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/gold/price', methods=['GET'])
def gold_price():
    """Get current gold price from cache or refresh if needed"""
    try:
        cached_price = get_cached_gold_price()
        price = cached_price if cached_price is not None else get_gold_token_price(force_refresh=True)
        return jsonify({
            'price': price,
            'timestamp': PRICE_CACHE['timestamp'].isoformat() if PRICE_CACHE['timestamp'] else datetime.now().isoformat(),
            'cached': cached_price is not None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/gold/earnings', methods=['GET'])
def handle_gold_earnings():
    """Get all gold earnings entries"""
    try:
        conn = get_db_connection()
        if not conn: return jsonify([])
        c = conn.cursor()
        c.execute('SELECT id, date, amount, source FROM gold_earnings ORDER BY date DESC')
        rows = c.fetchall()
        earnings = [{'id': row['id'], 'date': row['date'], 'amount': row['amount'], 'source': row['source']} for row in rows] if rows else []
        conn.close(); return jsonify(earnings)
    except Exception as e:
        print(f"Error fetching gold earnings: {e}"); return jsonify([])

@app.route('/inventory', methods=['GET'])
def handle_inventory():
    """Get all inventory items"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, quantity, rarity, source, current_price, weight, tier FROM inventory ORDER BY current_price DESC")
        items = cursor.fetchall()
        inventory = []
        for item in items:
            inventory.append({"id": item['id'], "name": item['name'], "quantity": item['quantity'], "rarity": item['rarity'], "source": item['source'], "current_price": item['current_price'], "weight": item['weight'], "tier": item['tier']})
        conn.close(); return jsonify(inventory)
    except Exception as e:
        print(f"Error handling inventory GET: {str(e)}"); return jsonify({"error": str(e)}), 500

@app.route('/roi/stats', methods=['GET'])
def get_roi_stats():
    """Get ROI statistics"""
    try:
        conn = get_db_connection()
        if not conn: return jsonify({ 'error': 'DB connection failed for ROI stats'}), 500
        c = conn.cursor()
        c.execute('SELECT SUM(amount) as total, COUNT(DISTINCT date) as days, MIN(date) as start_date FROM gold_earnings')
        result = c.fetchone()
        total_earnings = result['total'] if result['total'] else 0
        total_days = result['days'] if result['days'] else 1
        start_date = result['start_date'] if result['start_date'] else datetime.now().strftime('%Y-%m-%d')
        daily_average = total_earnings / total_days
        current_gold_price = get_gold_token_price()
        # Ensure gold price is valid before calculation
        current_gold_price_num = current_gold_price if isinstance(current_gold_price, (int, float)) else 0
        current_value_usd = total_earnings * current_gold_price_num
        total_investment = 475 # Constant investment amount (Adjust if needed)
        roi_percentage = ((current_value_usd - total_investment) / total_investment) * 100 if total_investment > 0 else 0
        projected_monthly = daily_average * 30
        daily_average_usd = daily_average * current_gold_price_num
        days_to_roi = float('inf')
        if daily_average_usd > 0:
            remaining_value = max(0, total_investment - current_value_usd)
            days_to_roi = remaining_value / daily_average_usd
        daily_apy = 0
        apy = 0
        if total_days > 0 and total_investment > 0:
            daily_apy = (daily_average_usd / total_investment) * 100
            apy = ((1 + (daily_apy / 100)) ** 365 - 1) * 100
        if total_days >= 30: prediction_confidence = 'HIGH'
        elif total_days >= 14: prediction_confidence = 'MEDIUM'
        else: prediction_confidence = 'LOW'
        conn.close()
        return jsonify({
            'total_investment': total_investment,
            'total_earnings': total_earnings, # Keep this as GOLD amount for clarity?
            'daily_average': daily_average, # Keep as GOLD?
            'projected_monthly': projected_monthly, # Keep as GOLD?
            'days_to_roi': days_to_roi,
            'roi_percentage': roi_percentage,
            'current_value_usd': current_value_usd,
            'prediction_confidence': prediction_confidence,
            'daily_apy': daily_apy,
            'apy': apy,
        })
    except Exception as e:
        print(f"Error calculating ROI stats: {e}")
        return jsonify({ 'error': 'Failed to calculate ROI stats'}), 500

@app.route('/market/analysis', methods=['GET'])
def market_analysis():
    """Get market analysis focused on loot recommendations"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, quantity, rarity, source, current_price, weight, tier FROM inventory ORDER BY current_price DESC")
        inventory = cursor.fetchall()
        if not inventory: return jsonify({ "recommendations": [], "message": "No items in inventory." })
        recommendations = []
        for item in inventory:
            name, quantity, rarity, source, price, weight, tier = item
            if not weight or weight == 0: continue
            efficiency = price / weight
            cursor.execute("SELECT AVG(current_price / NULLIF(weight, 0)) as avg_efficiency FROM inventory WHERE rarity = ? AND source = ? AND name != ? AND weight > 0", (rarity, source, name))
            result = cursor.fetchone()
            avg_efficiency = result[0] if result and result[0] is not None else efficiency
            if efficiency > avg_efficiency * 1.2: recommendations.append({ "item_name": name, "action": "SELL", "reason": f"Overvalued vs similar {rarity} {source} items" })
            elif efficiency < avg_efficiency * 0.8: recommendations.append({ "item_name": name, "action": "HOLD", "reason": f"Undervalued vs similar {rarity} {source} items" })
        conn.close()
        if not recommendations: return jsonify({ "recommendations": [], "message": "No recommendations available." })
        return jsonify({ "recommendations": recommendations[:5], "message": None })
    except Exception as e:
        print(f"Error in market analysis: {str(e)}")
        return jsonify({ "recommendations": [], "message": "Error fetching market analysis." })

@app.route('/data/<path:filename>')
def serve_data(filename):
    """Serve JSON data files from the 'data' directory"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, '..', 'data')
        return send_from_directory(data_dir, filename)
    except FileNotFoundError:
        print(f"File not found: {os.path.join(data_dir, filename)}")
        return jsonify({'error': f'File not found: {filename}'}), 404
    except Exception as e:
        print(f"Error serving file {filename}: {e}")
        return jsonify({'error': f'Error serving file: {filename}'}), 500

# --- Initialization ---
print("Checking database...")
if not check_db_exists():
    print("Database not found or incomplete, initializing...")
    if init_db():
        print("Database initialized successfully.")
    else:
        print("Failed to initialize database!")
else:
    print("Database exists and is ready")

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
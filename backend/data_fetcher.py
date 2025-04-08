import requests
import json
import os
from dotenv import load_dotenv
import time
from datetime import datetime
import logging
import shutil
from copy_data import copy_data_files

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_fetcher.log'),
        logging.StreamHandler()
    ]
)

class DataFetcher:
    def __init__(self):
        load_dotenv()
        self.base_url = 'https://api-production.defidungeons.gg'
        self.token = os.getenv('NIGHTVALE_BEARER_TOKEN')
        self.wallet_address = os.getenv('NIGHTVALE_WALLET_ADDRESS')
        self.headers = {
            'accept': 'application/json, text/plain, */*',
            'authorization': f'Bearer {self.token}',
            'x-selected-wallet-address': self.wallet_address,
            'Origin': 'https://dungeons.game',
            'Referer': 'https://dungeons.game/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.data_dir = 'data'
        self.frontend_data_dir = '../frontend/public/data'
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.frontend_data_dir, exist_ok=True)

    def _make_request(self, endpoint, params=None):
        """Make a request to the API"""
        try:
            response = requests.get(
                f'{self.base_url}{endpoint}',
                headers=self.headers,
                params=params,
                verify=True,  # SSL verification
                allow_redirects=True
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logging.error(f"Error making request to {endpoint}: {str(e)}")
            return None

    def _save_data(self, filename, data, default_data=None):
        """Save data to JSON file with timestamp"""
        if data is None and default_data is not None:
            data = default_data
        elif data is None:
            data = []

        filepath = os.path.join(self.data_dir, filename)
        with open(filepath, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'data': data
            }, f, indent=2)
        
        logging.info(f"Saved {filename}")

    def _filter_by_wallet(self, data, wallet_field='walletId'):
        """Filter data to only include entries matching the user's wallet address"""
        if not data or not isinstance(data, list):
            return []
        return [item for item in data if item.get(wallet_field) == self.wallet_address]

    def fetch_fungible_balances(self):
        """Fetch fungible asset balances"""
        data = self._make_request('/fungible-asset/my-balances')
        self._save_data('fungible_balances.json', data, default_data=[])

    def fetch_dungeon_definitions(self):
        """Fetch dungeon definitions"""
        data = self._make_request('/dungeon')
        self._save_data('dungeon_definitions.json', data, default_data=[])

    def fetch_inventory_items(self):
        """Fetch all inventory items"""
        data = self._make_request('/item/get-all-items')
        self._save_data('inventory_items.json', data, default_data=[])

    def fetch_recent_quest_claims(self):
        """Fetch recent quest claims (last 100000)"""
        data = self._make_request('/quest/recent-claims', {'limit': 100000})
        filtered_data = self._filter_by_wallet(data)
        self._save_data('recent_quest_claims.json', filtered_data, default_data=[])

    def fetch_recent_trip_rewards(self):
        """Fetch recent trip rewards (last 100000)"""
        data = self._make_request('/trip/recent-rewards', {'limit': 100000})
        filtered_data = self._filter_by_wallet(data)
        self._save_data('recent_trip_rewards.json', filtered_data, default_data=[])

    def fetch_recent_exchanges(self):
        """Fetch recent loot exchanges"""
        try:
            response = requests.get(
                f'{self.base_url}/loot-exchange/recent-exchanges',
                headers=self.headers,
                params={'limit': 100000},
                verify=True
            )
            response.raise_for_status()
            data = response.json()
            filtered_data = self._filter_by_wallet(data)
        except Exception as e:
            logging.error(f"Error fetching recent exchanges: {str(e)}")
            filtered_data = None
        
        self._save_data('recent_exchanges.json', filtered_data, default_data=[])

    def fetch_drop_chances(self):
        """Fetch base item drop chances for each dungeon"""
        try:
            # Initialize data structure
            all_drops = {
                'timestamp': datetime.now().isoformat(),
                'dungeon_specific': {}
            }

            # Define dungeons and classes
            dungeon_ids = {
                'CrimsonHall': 'Crimson Hall',
                'FrostboundKeep': 'Frostbound Keep',
                'AncientTombs': 'Ancient Tombs',
                'ThievesDen': 'Thieves Den',
                'ForgottenCrossroads': 'Forgotten Grove'
            }
            nft_classes = ['Warrior', 'Mage', 'Marksman']

            # Fetch drops for each dungeon
            for dungeon_id, dungeon_name in dungeon_ids.items():
                logging.info(f"Fetching drops for {dungeon_name}")
                
                all_drops['dungeon_specific'][dungeon_id] = {
                    'name': dungeon_name,
                    'drops': []
                }
                
                # Try each class to find drops
                for nft_class in nft_classes:
                    try:
                        params = {
                            'dungeonId': dungeon_id,
                            'nftClass': nft_class
                        }
                        
                        # Make the request with all required parameters
                        response = requests.get(
                            f'{self.base_url}/dungeon/base-item-drop-chances',
                            headers=self.headers,
                            params=params,
                            verify=True,
                            allow_redirects=True
                        )
                        
                        # Log the full request URL for debugging
                        logging.info(f"Request URL: {response.url}")
                        
                        response.raise_for_status()
                        drops = response.json()
                        
                        if drops and 'data' in drops and drops['data']:
                            all_drops['dungeon_specific'][dungeon_id]['drops'] = drops['data']
                            logging.info(f"Fetched {len(drops['data'])} drops for {dungeon_name} with {nft_class}")
                            
                            # Log some sample drops for debugging
                            sample_drops = drops['data'][:3]  # First 3 drops
                            for drop in sample_drops:
                                item = drop['itemMetadata']
                                logging.info(f"Sample drop: {item['name']} ({item['type']}, {item['rarity']}) - {drop['chance']*100:.4f}%")
                            break  # Stop trying other classes if we found drops
                        else:
                            logging.warning(f"No drops found for {dungeon_name} with {nft_class}")
                            
                    except Exception as e:
                        logging.error(f"Error fetching drops for {dungeon_name} with {nft_class}: {str(e)}")
                        logging.error(f"Response status: {response.status_code if 'response' in locals() else 'No response'}")
                        logging.error(f"Response text: {response.text if 'response' in locals() else 'No response'}")

            # Save the combined data
            filepath = os.path.join(self.data_dir, 'drop_chances.json')
            with open(filepath, 'w') as f:
                json.dump(all_drops, f, indent=2)

            logging.info("Successfully saved all drop chances")
            
        except Exception as e:
            logging.error(f"Error fetching drop chances: {str(e)}")
            # Save empty structure on error
            self._save_data('drop_chances.json', {
                'timestamp': datetime.now().isoformat(),
                'dungeon_specific': {}
            })

    def fetch_achievement_stats(self):
        """Fetch achievement stats"""
        data = self._make_request('/user/achievement-stat/me')
        default_stats = {
            "totalQuestCompleted": 0,
            "totalDungeonsCompleted": 0,
            "totalRaidBossesKilled": 0,
            "totalGoldEarned": 0
        }
        self._save_data('achievement_stats.json', data, default_data=default_stats)

    def fetch_all(self):
        """Fetch all data once"""
        logging.info("Starting data fetch")
        self.fetch_achievement_stats()
        self.fetch_fungible_balances()
        self.fetch_dungeon_definitions()
        self.fetch_inventory_items()
        self.fetch_recent_quest_claims()
        self.fetch_recent_trip_rewards()
        self.fetch_recent_exchanges()
        self.fetch_drop_chances()
        logging.info("Completed data fetch")
        
        # Copy data files to frontend
        copy_data_files()

    def fetch_dungeon_data(self):
        """Fetch only dungeon-related data"""
        logging.info("Starting dungeon data fetch")
        self.fetch_dungeon_definitions()
        self.fetch_drop_chances()
        logging.info("Completed dungeon data fetch")
        
        # Copy data files to frontend
        copy_data_files()

def main():
    fetcher = DataFetcher()
    try:
        # Fetch all data
        fetcher.fetch_all()
    except KeyboardInterrupt:
        logging.info("Data fetch interrupted")
    except Exception as e:
        logging.error(f"Error in data fetch: {str(e)}")

if __name__ == "__main__":
    main() 
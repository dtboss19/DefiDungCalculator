import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class NightvaleDataFetcher:
    def __init__(self):
        self.base_url = 'https://api-production.defidungeons.gg'
        self.bearer_token = os.getenv('NIGHTVALE_BEARER_TOKEN')
        self.wallet_address = os.getenv('NIGHTVALE_WALLET_ADDRESS')
        self.data_dir = 'data'
        
        # Create data directory if it doesn't exist
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def get_headers(self):
        return {
            'accept': 'application/json, text/plain, */*',
            'authorization': f'Bearer {self.bearer_token}',
            'x-selected-wallet-address': self.wallet_address
        }

    def fetch_and_save(self, endpoint, filename, params=None):
        print(f"\nFetching data from {endpoint}...")
        try:
            response = requests.get(
                f'{self.base_url}{endpoint}',
                headers=self.get_headers(),
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            # Add metadata
            full_data = {
                'data': data,
                'metadata': {
                    'fetched_at': datetime.now().isoformat(),
                    'endpoint': endpoint,
                    'params': params
                }
            }
            
            # Save to file
            filepath = os.path.join(self.data_dir, filename)
            with open(filepath, 'w') as f:
                json.dump(full_data, f, indent=2)
            
            print(f"Successfully saved data to {filepath}")
            return data
            
        except Exception as e:
            print(f"Error fetching {endpoint}: {str(e)}")
            return None

    def fetch_all_data(self):
        # Fetch achievement stats
        self.fetch_and_save(
            '/user/achievement-stat/me',
            'achievement_stats.json'
        )
        
        # Fetch dungeon drop chances for different NFT classes
        nft_classes = ['common', 'uncommon', 'rare', 'epic', 'legendary']
        for nft_class in nft_classes:
            self.fetch_and_save(
                '/dungeon/base-item-drop-chances',
                f'drop_chances_{nft_class}.json',
                params={'nftClass': nft_class}
            )
        
        # Fetch marketplace data
        self.fetch_and_save(
            '/marketplace/nfts',
            'marketplace_nfts.json'
        )
        
        # Fetch inventory
        self.fetch_and_save(
            '/inventory/items',
            'inventory.json'
        )
        
        # Fetch recent activities
        self.fetch_and_save(
            '/quest/claims',
            'recent_quests.json'
        )
        
        self.fetch_and_save(
            '/trip/rewards',
            'trip_rewards.json'
        )
        
        self.fetch_and_save(
            '/tavern-staking/recent-stakings',
            'recent_stakings.json'
        )

if __name__ == "__main__":
    fetcher = NightvaleDataFetcher()
    fetcher.fetch_all_data() 
import os
import shutil
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def copy_data_files():
    """Copy data files from backend/data to frontend/public/data"""
    source_dir = 'data'
    target_dir = '../frontend/public/data'
    
    # Create target directory if it doesn't exist
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        # Get list of JSON files in source directory
        json_files = [f for f in os.listdir(source_dir) if f.endswith('.json')]
        
        for file in json_files:
            source_path = os.path.join(source_dir, file)
            target_path = os.path.join(target_dir, file)
            
            # Copy file
            shutil.copy2(source_path, target_path)
            logging.info(f'Copied {file} to frontend/public/data')
            
        logging.info('All data files copied successfully')
        
    except Exception as e:
        logging.error(f'Error copying data files: {str(e)}')

if __name__ == '__main__':
    copy_data_files() 
import requests
from flask import Response, request
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ProxyService:
    BASE_URL = 'https://api-production.defidungeons.gg'

    @staticmethod
    def forward_request(path, method='GET', headers=None, data=None):
        try:
            print("\n=== Incoming Request Details ===")
            print(f"Path: {path}")
            print(f"Method: {method}")
            
            # Get required headers from the request
            auth_header = headers.get('Authorization') if headers else None
            wallet_header = headers.get('x-selected-wallet-address') if headers else None

            print("Headers received:", {
                'Authorization': '***' if auth_header else None,
                'x-selected-wallet-address': '***' if wallet_header else None
            })

            if not auth_header:
                print("Missing Authorization header")
                return Response(
                    json.dumps({
                        'error': 'Missing Authorization header',
                        'message': 'Please provide a valid Bearer token'
                    }), 
                    status=401, 
                    mimetype='application/json'
                )

            if not wallet_header:
                print("Missing wallet address header")
                return Response(
                    json.dumps({
                        'error': 'Missing wallet address header',
                        'message': 'Please provide a valid wallet address'
                    }), 
                    status=401, 
                    mimetype='application/json'
                )

            # Preserve the exact token format from the request
            auth_header = auth_header.strip()

            # Forward headers exactly as received
            request_headers = {
                'Authorization': auth_header,
                'x-selected-wallet-address': wallet_header.strip(),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://dungeons.game',
                'Referer': 'https://dungeons.game/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }

            print("\n=== Forwarding Request ===")
            print(f"URL: {ProxyService.BASE_URL}{path}")
            print("Headers:", {k: '***' if k.lower() in ['authorization', 'x-selected-wallet-address'] else v 
                             for k, v in request_headers.items()})

            # Make the request to the target API
            response = requests.request(
                method=method,
                url=f"{ProxyService.BASE_URL}{path}",
                headers=request_headers,
                json=data if data else None,
                verify=True,
                timeout=10
            )

            print(f"\n=== Response Details ===")
            print(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                error_message = response.text
                try:
                    error_json = response.json()
                    error_message = error_json.get('message', error_json.get('error', response.text))
                except:
                    pass
                print(f"Error: {error_message}")

                # Log the full response for debugging
                print("Full response headers:", dict(response.headers))
                print("Full response body:", response.text)

                return Response(
                    json.dumps({
                        'error': 'API request failed',
                        'message': error_message,
                        'status': response.status_code
                    }),
                    status=response.status_code,
                    mimetype='application/json'
                )

            # Forward the response
            excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            headers = [(name, value) for (name, value) in response.raw.headers.items()
                      if name.lower() not in excluded_headers]

            return Response(
                response.content,
                response.status_code,
                headers
            )

        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return Response(
                json.dumps({
                    'error': 'Failed to connect to game server',
                    'message': str(e)
                }),
                status=503,
                mimetype='application/json'
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                json.dumps({
                    'error': 'Internal server error',
                    'message': str(e)
                }),
                status=500,
                mimetype='application/json'
            ) 
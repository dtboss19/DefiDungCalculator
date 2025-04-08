from flask import request, make_response
from functools import wraps

def cors_middleware(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the response from the route
        response = f(*args, **kwargs)
        
        # Add CORS headers
        headers = {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-selected-wallet-address',
            'Access-Control-Allow-Credentials': 'true'
        }
        
        # If it's a Response object, add headers
        if hasattr(response, 'headers'):
            for key, value in headers.items():
                response.headers[key] = value
        
        return response
    return decorated_function

def handle_preflight():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-selected-wallet-address')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    return None 
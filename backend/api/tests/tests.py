import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("Starting API test...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/set-csrf-token", timeout=5)
        print("✓ Server is running")
    except requests.ConnectionError:
        print("✗ Server is not running! Please run: python manage.py runserver")
        return
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return
    
    session = requests.Session()
    
    # Get CSRF token
    try:
        response = session.get(f"{BASE_URL}/set-csrf-token")
        csrf_token = response.json()['csrftoken']
        print(f"✓ CSRF Token: {csrf_token}")
    except Exception as e:
        print(f"✗ CSRF token error: {e}")
        return
    
    # Register
    try:
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "1234567890",
            "password": "testpass123",
            "confirm_password": "testpass123",
            "role": "student"
        }
        
        response = session.post(
            f"{BASE_URL}/register",
            json=register_data,
            headers={"X-CSRFToken": csrf_token}
        )
        print("✓ Register:", response.json())
    except Exception as e:
        print(f"✗ Register error: {e}")
    
    # Login
    try:
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = session.post(
            f"{BASE_URL}/login",
            json=login_data,
            headers={"X-CSRFToken": csrf_token}
        )
        print("✓ Login:", response.json())
    except Exception as e:
        print(f"✗ Login error: {e}")
    
    # Get user info
    try:
        response = session.get(f"{BASE_URL}/user")
        print("✓ User info:", response.json())
    except Exception as e:
        print(f"✗ User info error: {e}")

if __name__ == "__main__":
    test_api()
    print("Test completed!")
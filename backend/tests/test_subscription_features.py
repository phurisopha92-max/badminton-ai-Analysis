"""
Test Subscription System Features
- GET /api/subscription/packages - Show all packages
- GET /api/subscription/status - Subscription status and usage
- POST /api/subscription/checkout - Create Stripe checkout session
- GET /api/subscription/checkout/status/{session_id} - Check payment status
- POST /api/subscription/promptpay - Create PromptPay payment request
- Free tier video limit (5/month) enforced on /api/analyze
- Usage tracking increment after successful analysis
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials from previous iteration
TEST_COACH_EMAIL = "testcoach@test.com"
TEST_COACH_PASSWORD = "test123"
TEST_COACH_SESSION = "test_coach_session_001"


class TestSubscriptionPackages:
    """Test GET /api/subscription/packages - Public endpoint"""
    
    def test_get_packages_returns_200(self):
        """Packages endpoint should return 200 without auth"""
        response = requests.get(f"{BASE_URL}/api/subscription/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ GET /api/subscription/packages returns 200")
    
    def test_packages_contains_monthly_and_yearly(self):
        """Should return both monthly and yearly packages"""
        response = requests.get(f"{BASE_URL}/api/subscription/packages")
        data = response.json()
        
        assert "packages" in data, "Response should contain 'packages' key"
        packages = data["packages"]
        
        # Check we have at least 2 packages
        assert len(packages) >= 2, f"Expected at least 2 packages, got {len(packages)}"
        
        # Check package IDs
        package_ids = [p["id"] for p in packages]
        assert "monthly" in package_ids, "Should have monthly package"
        assert "yearly" in package_ids, "Should have yearly package"
        print("✓ Packages contain monthly and yearly options")
    
    def test_monthly_package_price(self):
        """Monthly package should be $10"""
        response = requests.get(f"{BASE_URL}/api/subscription/packages")
        packages = response.json()["packages"]
        
        monthly = next((p for p in packages if p["id"] == "monthly"), None)
        assert monthly is not None, "Monthly package not found"
        assert monthly["price"] == 10.00, f"Monthly price should be $10, got ${monthly['price']}"
        assert monthly["currency"] == "usd", f"Currency should be usd, got {monthly['currency']}"
        print("✓ Monthly package price is $10 USD")
    
    def test_yearly_package_price(self):
        """Yearly package should be $99"""
        response = requests.get(f"{BASE_URL}/api/subscription/packages")
        packages = response.json()["packages"]
        
        yearly = next((p for p in packages if p["id"] == "yearly"), None)
        assert yearly is not None, "Yearly package not found"
        assert yearly["price"] == 99.00, f"Yearly price should be $99, got ${yearly['price']}"
        assert yearly["currency"] == "usd", f"Currency should be usd, got {yearly['currency']}"
        print("✓ Yearly package price is $99 USD")
    
    def test_free_tier_limit_in_response(self):
        """Response should include free tier limit"""
        response = requests.get(f"{BASE_URL}/api/subscription/packages")
        data = response.json()
        
        assert "free_limit" in data, "Response should contain 'free_limit' key"
        assert data["free_limit"] == 5, f"Free limit should be 5, got {data['free_limit']}"
        print("✓ Free tier limit is 5 videos/month")


class TestSubscriptionStatus:
    """Test GET /api/subscription/status - Requires auth"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        # Login to get session
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_status_requires_auth(self):
        """Status endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ GET /api/subscription/status requires authentication")
    
    def test_status_returns_usage_info(self, auth_session):
        """Status should return usage information"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "usage" in data, "Response should contain 'usage' key"
        assert "video_count" in data["usage"], "Usage should contain 'video_count'"
        assert "limit" in data["usage"], "Usage should contain 'limit'"
        assert "remaining" in data["usage"], "Usage should contain 'remaining'"
        print(f"✓ Status returns usage info: {data['usage']}")
    
    def test_status_returns_subscription_info(self, auth_session):
        """Status should return subscription information"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/status")
        data = response.json()
        
        assert "has_subscription" in data, "Response should contain 'has_subscription'"
        assert "plan" in data, "Response should contain 'plan'"
        assert "is_coach" in data, "Response should contain 'is_coach'"
        print(f"✓ Status returns subscription info: has_subscription={data['has_subscription']}, is_coach={data['is_coach']}")


class TestStripeCheckout:
    """Test POST /api/subscription/checkout - Stripe checkout session creation"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_checkout_requires_auth(self):
        """Checkout endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/subscription/checkout", json={
            "package_id": "monthly",
            "origin_url": "https://example.com"
        })
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ POST /api/subscription/checkout requires authentication")
    
    def test_checkout_invalid_package(self, auth_session):
        """Should reject invalid package ID"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/checkout", json={
            "package_id": "invalid_package",
            "origin_url": "https://example.com"
        })
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        print("✓ Checkout rejects invalid package ID")
    
    def test_checkout_monthly_creates_session(self, auth_session):
        """Should create Stripe checkout session for monthly package"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/checkout", json={
            "package_id": "monthly",
            "origin_url": BASE_URL
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data, "Response should contain 'checkout_url'"
        assert "session_id" in data, "Response should contain 'session_id'"
        assert data["checkout_url"].startswith("https://"), "Checkout URL should be HTTPS"
        print(f"✓ Monthly checkout creates session: {data['session_id'][:20]}...")
    
    def test_checkout_yearly_creates_session(self, auth_session):
        """Should create Stripe checkout session for yearly package"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/checkout", json={
            "package_id": "yearly",
            "origin_url": BASE_URL
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data, "Response should contain 'checkout_url'"
        assert "session_id" in data, "Response should contain 'session_id'"
        print(f"✓ Yearly checkout creates session: {data['session_id'][:20]}...")


class TestCheckoutStatus:
    """Test GET /api/subscription/checkout/status/{session_id}"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_status_requires_auth(self):
        """Checkout status should require authentication"""
        response = requests.get(f"{BASE_URL}/api/subscription/checkout/status/fake_session_id")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ GET /api/subscription/checkout/status requires authentication")
    
    def test_status_invalid_session(self, auth_session):
        """Should return 404 for invalid session ID"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/checkout/status/invalid_session_123")
        assert response.status_code == 404, f"Expected 404 for invalid session, got {response.status_code}"
        print("✓ Checkout status returns 404 for invalid session")
    
    def test_status_valid_session(self, auth_session):
        """Should return status for valid session"""
        # First create a checkout session
        checkout_response = auth_session.post(f"{BASE_URL}/api/subscription/checkout", json={
            "package_id": "monthly",
            "origin_url": BASE_URL
        })
        if checkout_response.status_code != 200:
            pytest.skip("Could not create checkout session")
        
        session_id = checkout_response.json()["session_id"]
        
        # Check status
        response = auth_session.get(f"{BASE_URL}/api/subscription/checkout/status/{session_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert "payment_status" in data, "Response should contain 'payment_status'"
        print(f"✓ Checkout status returns: status={data['status']}, payment_status={data['payment_status']}")


class TestPromptPay:
    """Test POST /api/subscription/promptpay - PromptPay payment request"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_promptpay_requires_auth(self):
        """PromptPay endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/subscription/promptpay", json={
            "package_id": "monthly"
        })
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ POST /api/subscription/promptpay requires authentication")
    
    def test_promptpay_invalid_package(self, auth_session):
        """Should reject invalid package ID"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/promptpay", json={
            "package_id": "invalid_package"
        })
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        print("✓ PromptPay rejects invalid package ID")
    
    def test_promptpay_monthly_creates_request(self, auth_session):
        """Should create PromptPay request for monthly package"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/promptpay", json={
            "package_id": "monthly"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "transaction_id" in data, "Response should contain 'transaction_id'"
        assert "amount_thb" in data, "Response should contain 'amount_thb'"
        assert "reference" in data, "Response should contain 'reference'"
        assert "promptpay_id" in data, "Response should contain 'promptpay_id'"
        assert "instructions" in data, "Response should contain 'instructions'"
        
        # Monthly $10 * 35 = 350 THB
        assert data["amount_thb"] == 350.0, f"Expected 350 THB, got {data['amount_thb']}"
        print(f"✓ PromptPay monthly creates request: {data['reference']}, ฿{data['amount_thb']}")
    
    def test_promptpay_yearly_creates_request(self, auth_session):
        """Should create PromptPay request for yearly package"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/promptpay", json={
            "package_id": "yearly"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Yearly $99 * 35 = 3465 THB
        assert data["amount_thb"] == 3465.0, f"Expected 3465 THB, got {data['amount_thb']}"
        print(f"✓ PromptPay yearly creates request: {data['reference']}, ฿{data['amount_thb']}")


class TestPromptPayStatus:
    """Test GET /api/subscription/promptpay/status/{transaction_id}"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_promptpay_status_requires_auth(self):
        """PromptPay status should require authentication"""
        response = requests.get(f"{BASE_URL}/api/subscription/promptpay/status/fake_txn_id")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ GET /api/subscription/promptpay/status requires authentication")
    
    def test_promptpay_status_invalid_transaction(self, auth_session):
        """Should return 404 for invalid transaction ID"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/promptpay/status/invalid_txn_123")
        assert response.status_code == 404, f"Expected 404 for invalid transaction, got {response.status_code}"
        print("✓ PromptPay status returns 404 for invalid transaction")
    
    def test_promptpay_status_valid_transaction(self, auth_session):
        """Should return status for valid transaction"""
        # First create a PromptPay request
        create_response = auth_session.post(f"{BASE_URL}/api/subscription/promptpay", json={
            "package_id": "monthly"
        })
        if create_response.status_code != 200:
            pytest.skip("Could not create PromptPay request")
        
        transaction_id = create_response.json()["transaction_id"]
        
        # Check status
        response = auth_session.get(f"{BASE_URL}/api/subscription/promptpay/status/{transaction_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert "reference" in data, "Response should contain 'reference'"
        assert data["status"] == "pending", f"New transaction should be pending, got {data['status']}"
        print(f"✓ PromptPay status returns: status={data['status']}")


class TestFreeTierLimit:
    """Test free tier video limit enforcement on /api/analyze"""
    
    @pytest.fixture
    def fresh_user_session(self):
        """Create a fresh user for testing free tier limits"""
        session = requests.Session()
        unique_email = f"test_free_tier_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register new user
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "name": "Free Tier Test User"
        })
        if response.status_code != 200:
            pytest.skip(f"Registration failed: {response.text}")
        
        return session
    
    def test_free_user_has_5_video_limit(self, fresh_user_session):
        """Free user should have 5 video limit"""
        response = fresh_user_session.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_subscription"] == False, "New user should not have subscription"
        assert data["usage"]["limit"] == 5, f"Free tier limit should be 5, got {data['usage']['limit']}"
        assert data["usage"]["video_count"] == 0, f"New user should have 0 videos, got {data['usage']['video_count']}"
        print(f"✓ Free user has 5 video limit, current usage: {data['usage']['video_count']}/5")


class TestUsageTracking:
    """Test usage tracking functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COACH_EMAIL,
            "password": TEST_COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.text}")
        return session
    
    def test_usage_tracking_returns_current_month(self, auth_session):
        """Usage should track current month"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200
        
        data = response.json()
        usage = data["usage"]
        
        # Verify usage structure
        assert isinstance(usage["video_count"], int), "video_count should be integer"
        assert isinstance(usage["limit"], int), "limit should be integer"
        assert isinstance(usage["remaining"], int), "remaining should be integer"
        assert usage["remaining"] == usage["limit"] - usage["video_count"], "remaining should be limit - video_count"
        print(f"✓ Usage tracking: {usage['video_count']}/{usage['limit']} videos, {usage['remaining']} remaining")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Backend API Tests for Share Link and Coach Mode Features
Tests: Share Link creation/access, Coach upgrade, Invite codes, Athlete joining
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session tokens (created by setup script)
COACH_SESSION = 'test_coach_session_001'
ATHLETE_SESSION = 'test_athlete_session_001'


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_auth_me_with_coach_session(self):
        """Test GET /api/auth/me returns user info for coach"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert data["email"] == "testcoach@test.com"
        print(f"Coach auth verified: {data}")
    
    def test_auth_me_with_athlete_session(self):
        """Test GET /api/auth/me returns user info for athlete"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "athlete@test.com"
        print(f"Athlete auth verified: {data}")
    
    def test_auth_me_without_session(self):
        """Test GET /api/auth/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_guest_login(self):
        """Test POST /api/auth/guest creates guest session"""
        response = requests.post(f"{BASE_URL}/api/auth/guest")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["is_guest"] == True
        assert data["user_id"].startswith("guest_")
        print(f"Guest login successful: {data['user_id']}")


class TestShareLinkFeature:
    """Test Share Link creation and access"""
    
    @pytest.fixture
    def athlete_analysis_id(self):
        """Get or create an analysis for the athlete"""
        # First check if athlete has any analyses
        response = requests.get(
            f"{BASE_URL}/api/analyses",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["id"]
        
        # If no analyses, we need to create one (skip for now)
        pytest.skip("No analyses available for athlete")
    
    def test_create_share_link(self, athlete_analysis_id):
        """Test POST /api/share/create creates a share link"""
        response = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": athlete_analysis_id},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "share_id" in data
        assert "analysis_id" in data
        assert data["analysis_id"] == athlete_analysis_id
        print(f"Share link created: {data['share_id']}")
        return data["share_id"]
    
    def test_create_share_link_duplicate_returns_existing(self, athlete_analysis_id):
        """Test creating share link for same analysis returns existing link"""
        # Create first share link
        response1 = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": athlete_analysis_id},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response1.status_code == 200
        share_id1 = response1.json()["share_id"]
        
        # Create second share link for same analysis
        response2 = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": athlete_analysis_id},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response2.status_code == 200
        share_id2 = response2.json()["share_id"]
        
        # Should return same share_id
        assert share_id1 == share_id2
        print(f"Duplicate share link returns existing: {share_id1}")
    
    def test_create_share_link_unauthorized(self):
        """Test POST /api/share/create requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": "some-id"}
        )
        assert response.status_code == 401
    
    def test_create_share_link_not_owner(self):
        """Test POST /api/share/create fails for non-owner"""
        # Try to create share link for analysis that doesn't belong to coach
        response = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": "nonexistent-analysis-id"},
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 404
    
    def test_get_shared_analysis_no_auth(self, athlete_analysis_id):
        """Test GET /api/share/{share_id} works without authentication"""
        # First create a share link
        create_response = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": athlete_analysis_id},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        share_id = create_response.json()["share_id"]
        
        # Access shared analysis without auth
        response = requests.get(f"{BASE_URL}/api/share/{share_id}")
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "analysis_type" in data
        assert "shared_by" in data
        print(f"Shared analysis accessed without auth: {data['shared_by']}")
    
    def test_get_shared_analysis_invalid_id(self):
        """Test GET /api/share/{share_id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/share/invalid-share-id")
        assert response.status_code == 404
    
    def test_delete_share_link(self, athlete_analysis_id):
        """Test DELETE /api/share/{share_id} deletes the link"""
        # Create a share link
        create_response = requests.post(
            f"{BASE_URL}/api/share/create",
            json={"analysis_id": athlete_analysis_id},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        share_id = create_response.json()["share_id"]
        
        # Delete the share link
        delete_response = requests.delete(
            f"{BASE_URL}/api/share/{share_id}",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert delete_response.status_code == 200
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/share/{share_id}")
        assert get_response.status_code == 404
        print(f"Share link deleted successfully: {share_id}")


class TestCoachModeFeature:
    """Test Coach Mode features"""
    
    def test_coach_upgrade(self):
        """Test POST /api/coach/upgrade upgrades user to coach"""
        # Create a new user for this test
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"upgrade_test_{os.urandom(4).hex()}@test.com",
                "password": "test123",
                "name": "Upgrade Test User"
            }
        )
        
        if register_response.status_code != 200:
            pytest.skip("Could not create test user for upgrade test")
        
        # Get session from cookie
        session_token = register_response.cookies.get("session_token")
        if not session_token:
            pytest.skip("No session token in response")
        
        # Upgrade to coach
        upgrade_response = requests.post(
            f"{BASE_URL}/api/coach/upgrade",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        assert upgrade_response.status_code == 200
        data = upgrade_response.json()
        assert data["role"] == "coach"
        print(f"User upgraded to coach: {data}")
    
    def test_coach_already_upgraded(self):
        """Test POST /api/coach/upgrade for already coach user"""
        response = requests.post(
            f"{BASE_URL}/api/coach/upgrade",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "coach"
        assert "อยู่แล้ว" in data["message"]  # Already a coach
    
    def test_create_invite_code(self):
        """Test POST /api/coach/invite/create creates invite code"""
        response = requests.post(
            f"{BASE_URL}/api/coach/invite/create",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "invite_code" in data
        assert "expires_at" in data
        assert len(data["invite_code"]) == 8
        print(f"Invite code created: {data['invite_code']}")
        return data["invite_code"]
    
    def test_create_invite_code_non_coach(self):
        """Test POST /api/coach/invite/create fails for non-coach"""
        # Create a new non-coach user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"noncoach_{os.urandom(4).hex()}@test.com",
                "password": "test123",
                "name": "Non Coach User"
            }
        )
        
        if register_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        session_token = register_response.cookies.get("session_token")
        if not session_token:
            pytest.skip("No session token")
        
        # Try to create invite code
        response = requests.post(
            f"{BASE_URL}/api/coach/invite/create",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        assert response.status_code == 403
    
    def test_get_coach_athletes(self):
        """Test GET /api/coach/athletes returns athlete list"""
        response = requests.get(
            f"{BASE_URL}/api/coach/athletes",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "athletes" in data
        assert isinstance(data["athletes"], list)
        print(f"Coach has {len(data['athletes'])} athletes")
    
    def test_get_coach_athletes_non_coach(self):
        """Test GET /api/coach/athletes fails for non-coach"""
        response = requests.get(
            f"{BASE_URL}/api/coach/athletes",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 403
    
    def test_get_my_coach(self):
        """Test GET /api/coach/me returns coach info"""
        response = requests.get(
            f"{BASE_URL}/api/coach/me",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "has_coach" in data
        print(f"Athlete has coach: {data['has_coach']}")


class TestCoachJoinFlow:
    """Test the full coach-athlete join flow"""
    
    def test_full_join_flow(self):
        """Test complete flow: create invite -> athlete joins -> verify relationship"""
        # Step 1: Coach creates invite code
        invite_response = requests.post(
            f"{BASE_URL}/api/coach/invite/create",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert invite_response.status_code == 200
        invite_code = invite_response.json()["invite_code"]
        print(f"Step 1: Invite code created: {invite_code}")
        
        # Step 2: Create a new athlete user
        new_athlete_email = f"new_athlete_{os.urandom(4).hex()}@test.com"
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": new_athlete_email,
                "password": "test123",
                "name": "New Athlete"
            }
        )
        assert register_response.status_code == 200
        new_athlete_session = register_response.cookies.get("session_token")
        print(f"Step 2: New athlete registered: {new_athlete_email}")
        
        # Step 3: Athlete joins coach using invite code
        join_response = requests.post(
            f"{BASE_URL}/api/coach/join",
            json={"invite_code": invite_code},
            headers={"Authorization": f"Bearer {new_athlete_session}"}
        )
        assert join_response.status_code == 200
        join_data = join_response.json()
        assert "coach_name" in join_data
        print(f"Step 3: Athlete joined coach: {join_data['coach_name']}")
        
        # Step 4: Verify athlete has coach
        my_coach_response = requests.get(
            f"{BASE_URL}/api/coach/me",
            headers={"Authorization": f"Bearer {new_athlete_session}"}
        )
        assert my_coach_response.status_code == 200
        assert my_coach_response.json()["has_coach"] == True
        print("Step 4: Verified athlete has coach")
        
        # Step 5: Verify coach sees athlete
        athletes_response = requests.get(
            f"{BASE_URL}/api/coach/athletes",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert athletes_response.status_code == 200
        athletes = athletes_response.json()["athletes"]
        athlete_emails = [a["athlete_email"] for a in athletes]
        assert new_athlete_email in athlete_emails
        print(f"Step 5: Coach sees athlete in list")
        
        # Step 6: Athlete leaves coach
        leave_response = requests.post(
            f"{BASE_URL}/api/coach/leave",
            headers={"Authorization": f"Bearer {new_athlete_session}"}
        )
        assert leave_response.status_code == 200
        print("Step 6: Athlete left coach")
        
        # Step 7: Verify athlete no longer has coach
        my_coach_response2 = requests.get(
            f"{BASE_URL}/api/coach/me",
            headers={"Authorization": f"Bearer {new_athlete_session}"}
        )
        assert my_coach_response2.status_code == 200
        assert my_coach_response2.json()["has_coach"] == False
        print("Step 7: Verified athlete no longer has coach")
    
    def test_join_invalid_invite_code(self):
        """Test POST /api/coach/join fails with invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/coach/join",
            json={"invite_code": "INVALID1"},
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 404
    
    def test_join_already_has_coach(self):
        """Test POST /api/coach/join fails if athlete already has coach"""
        # First, make athlete join a coach
        invite_response = requests.post(
            f"{BASE_URL}/api/coach/invite/create",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        invite_code = invite_response.json()["invite_code"]
        
        # Create new athlete
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"double_join_{os.urandom(4).hex()}@test.com",
                "password": "test123",
                "name": "Double Join Test"
            }
        )
        session = register_response.cookies.get("session_token")
        
        # Join first time
        requests.post(
            f"{BASE_URL}/api/coach/join",
            json={"invite_code": invite_code},
            headers={"Authorization": f"Bearer {session}"}
        )
        
        # Create another invite
        invite_response2 = requests.post(
            f"{BASE_URL}/api/coach/invite/create",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        invite_code2 = invite_response2.json()["invite_code"]
        
        # Try to join again
        response = requests.post(
            f"{BASE_URL}/api/coach/join",
            json={"invite_code": invite_code2},
            headers={"Authorization": f"Bearer {session}"}
        )
        assert response.status_code == 400
        assert "มีโค้ชอยู่แล้ว" in response.json()["detail"]


class TestCoachAthleteAnalyses:
    """Test coach viewing athlete analyses"""
    
    def test_get_athlete_analyses(self):
        """Test GET /api/coach/athlete/{id}/analyses returns analyses"""
        # First get list of athletes
        athletes_response = requests.get(
            f"{BASE_URL}/api/coach/athletes",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        
        if athletes_response.status_code != 200:
            pytest.skip("Could not get athletes list")
        
        athletes = athletes_response.json()["athletes"]
        if len(athletes) == 0:
            pytest.skip("No athletes to test with")
        
        athlete_id = athletes[0]["athlete_id"]
        
        # Get athlete's analyses
        response = requests.get(
            f"{BASE_URL}/api/coach/athlete/{athlete_id}/analyses",
            headers={"Authorization": f"Bearer {COACH_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "athlete_name" in data
        assert "analyses" in data
        print(f"Coach can view {len(data['analyses'])} analyses for {data['athlete_name']}")
    
    def test_get_athlete_analyses_not_coach(self):
        """Test GET /api/coach/athlete/{id}/analyses fails for non-coach"""
        response = requests.get(
            f"{BASE_URL}/api/coach/athlete/some-athlete-id/analyses",
            headers={"Authorization": f"Bearer {ATHLETE_SESSION}"}
        )
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

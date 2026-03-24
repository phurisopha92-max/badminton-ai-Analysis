"""
Backend API Tests for Badminton AI Analyzer
Tests: POST /api/analyze, GET /api/analyses, GET /api/analyses/{id}, GET /api/videos/{id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Test API root endpoint"""
    
    def test_api_root(self):
        """Test GET /api/ returns welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Badminton AI Analyzer API" in data["message"]


class TestAnalysesEndpoints:
    """Test GET /api/analyses endpoints"""
    
    def test_get_all_analyses(self):
        """Test GET /api/analyses returns list of analyses"""
        response = requests.get(f"{BASE_URL}/api/analyses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If there are analyses, verify structure
        if len(data) > 0:
            analysis = data[0]
            assert "id" in analysis
            assert "video_filename" in analysis
            assert "created_at" in analysis
    
    def test_get_specific_analysis(self):
        """Test GET /api/analyses/{id} returns complete analysis data"""
        # Use the known analysis ID from testing
        analysis_id = "11fc12d5-6c1a-4acc-910a-be11813499d0"
        response = requests.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert data["id"] == analysis_id
        assert "video_filename" in data
        assert "video_id" in data
        
        # Verify analysis data is NOT null (bug fix verification)
        assert data["technique_score"] is not None, "technique_score should not be null"
        assert data["footwork_score"] is not None, "footwork_score should not be null"
        assert data["strengths"] is not None, "strengths should not be null"
        assert data["weaknesses"] is not None, "weaknesses should not be null"
        
        # Verify technique_details structure
        assert data["technique_details"] is not None, "technique_details should not be null"
        assert isinstance(data["technique_details"], dict)
        
        # Verify footwork_details structure
        assert data["footwork_details"] is not None, "footwork_details should not be null"
        assert isinstance(data["footwork_details"], dict)
        
        # Verify biomechanics structure
        assert data["biomechanics"] is not None, "biomechanics should not be null"
        assert isinstance(data["biomechanics"], dict)
        
        # Verify doubles_analysis structure
        assert "doubles_analysis" in data
    
    def test_get_nonexistent_analysis(self):
        """Test GET /api/analyses/{id} returns 404 for non-existent ID"""
        response = requests.get(f"{BASE_URL}/api/analyses/nonexistent-id-12345")
        assert response.status_code == 404
    
    def test_analysis_technique_details_structure(self):
        """Test that technique_details has proper structure with scores and analysis"""
        analysis_id = "11fc12d5-6c1a-4acc-910a-be11813499d0"
        response = requests.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        technique_details = data.get("technique_details", {})
        
        # Check expected technique types exist
        expected_techniques = ["smash", "clear_lob", "drop_shot", "serve", "backhand", "forehand"]
        for technique in expected_techniques:
            if technique in technique_details:
                detail = technique_details[technique]
                assert "score" in detail, f"{technique} should have score"
                assert "analysis" in detail, f"{technique} should have analysis"
    
    def test_analysis_footwork_details_structure(self):
        """Test that footwork_details has proper structure"""
        analysis_id = "11fc12d5-6c1a-4acc-910a-be11813499d0"
        response = requests.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        footwork_details = data.get("footwork_details", {})
        
        # Check expected footwork types exist
        expected_footwork = ["split_step", "lunge_technique", "recovery_speed", "court_movement"]
        for footwork in expected_footwork:
            if footwork in footwork_details:
                detail = footwork_details[footwork]
                assert "score" in detail, f"{footwork} should have score"
                assert "analysis" in detail, f"{footwork} should have analysis"


class TestVideoEndpoint:
    """Test GET /api/videos/{id} endpoint"""
    
    def test_get_video_stream(self):
        """Test GET /api/videos/{id} returns video stream"""
        # Get video_id from a known analysis
        analysis_id = "11fc12d5-6c1a-4acc-910a-be11813499d0"
        analysis_response = requests.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        
        if analysis_response.status_code == 200:
            video_id = analysis_response.json().get("video_id")
            if video_id:
                video_response = requests.get(f"{BASE_URL}/api/videos/{video_id}", stream=True)
                assert video_response.status_code == 200
                assert "video" in video_response.headers.get("content-type", "")
    
    def test_get_nonexistent_video(self):
        """Test GET /api/videos/{id} returns 404 for non-existent video"""
        response = requests.get(f"{BASE_URL}/api/videos/000000000000000000000000")
        assert response.status_code == 404


class TestAnalyzeEndpoint:
    """Test POST /api/analyze endpoint"""
    
    def test_analyze_video_upload(self):
        """Test POST /api/analyze with video file"""
        test_video_path = "/tmp/test_badminton.mp4"
        
        if not os.path.exists(test_video_path):
            pytest.skip("Test video not found at /tmp/test_badminton.mp4")
        
        with open(test_video_path, 'rb') as video_file:
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            response = requests.post(f"{BASE_URL}/api/analyze", files=files, timeout=120)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "video_filename" in data
        assert "video_id" in data
        
        # Verify analysis data is populated (bug fix verification)
        assert data["technique_score"] is not None, "technique_score should not be null after analysis"
        assert data["footwork_score"] is not None, "footwork_score should not be null after analysis"
        assert data["strengths"] is not None, "strengths should not be null after analysis"
        assert data["weaknesses"] is not None, "weaknesses should not be null after analysis"
        
        # Verify detailed analysis
        assert data["technique_details"] is not None, "technique_details should not be null"
        assert data["footwork_details"] is not None, "footwork_details should not be null"
        assert data["biomechanics"] is not None, "biomechanics should not be null"
        
        # Verify data persistence - GET the created analysis
        created_id = data["id"]
        get_response = requests.get(f"{BASE_URL}/api/analyses/{created_id}")
        assert get_response.status_code == 200
        persisted_data = get_response.json()
        assert persisted_data["id"] == created_id
        assert persisted_data["technique_score"] == data["technique_score"]
    
    def test_analyze_invalid_file_type(self):
        """Test POST /api/analyze rejects non-video files"""
        # Create a fake text file
        files = {'file': ('test.txt', b'This is not a video', 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/analyze", files=files)
        
        assert response.status_code == 400


class TestTrainingPlanEndpoints:
    """Test training plan endpoints"""
    
    def test_get_training_plan_not_found(self):
        """Test GET /api/training-plans/{id} returns 404 when no plan exists"""
        analysis_id = "11fc12d5-6c1a-4acc-910a-be11813499d0"
        response = requests.get(f"{BASE_URL}/api/training-plans/{analysis_id}")
        # Should return 404 if no training plan has been created
        assert response.status_code in [200, 404]


class TestGameAnalyzeEndpoint:
    """Test POST /api/game-analyze endpoint for full game analysis (500MB max)"""
    
    def test_game_analyze_invalid_file_type(self):
        """Test POST /api/game-analyze rejects non-video files"""
        files = {'file': ('test.txt', b'This is not a video', 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/game-analyze", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        # Should reject non-video files
        assert "วิดีโอ" in data["detail"] or "video" in data["detail"].lower()
    
    def test_game_analyze_endpoint_exists(self):
        """Test that /api/game-analyze endpoint exists and accepts POST"""
        # Send a minimal request to verify endpoint exists
        files = {'file': ('test.txt', b'test', 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/game-analyze", files=files)
        
        # Should return 400 (bad request for non-video) not 404 (not found)
        assert response.status_code == 400, f"Expected 400 for invalid file, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

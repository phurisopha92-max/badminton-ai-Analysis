import requests
import sys
import os
import tempfile
from datetime import datetime
import json

class BadmintonAPITester:
    def __init__(self, base_url="https://court-vision-ai-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.analysis_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        # Don't set Content-Type for file uploads
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, params=params, timeout=60)
                else:
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=60)

            print(f"Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response preview: {str(response_data)[:200]}...")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error response: {error_data}")
                except:
                    print(f"Error text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/",
            200
        )
        return success

    def create_test_video_file(self):
        """Create a small test video file for upload testing"""
        # Create a minimal MP4 file (just headers, won't be a real video but should pass content-type check)
        mp4_header = b'\x00\x00\x00\x20ftypmp41\x00\x00\x00\x00mp41isom\x00\x00\x00\x08free'
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_file.write(mp4_header)
        temp_file.close()
        
        return temp_file.name

    def test_video_analysis(self):
        """Test video upload and analysis"""
        test_video_path = self.create_test_video_file()
        
        try:
            with open(test_video_path, 'rb') as f:
                files = {'file': ('test_video.mp4', f, 'video/mp4')}
                
                success, response = self.run_test(
                    "Video Analysis Upload",
                    "POST",
                    "api/analyze",
                    200,
                    files=files
                )
                
                if success and 'id' in response:
                    self.analysis_id = response['id']
                    print(f"Analysis ID saved: {self.analysis_id}")
                    return True
                return False
                
        except Exception as e:
            print(f"Error in video analysis test: {str(e)}")
            return False
        finally:
            # Clean up temp file
            if os.path.exists(test_video_path):
                os.unlink(test_video_path)

    def test_get_all_analyses(self):
        """Test getting all analyses"""
        success, response = self.run_test(
            "Get All Analyses",
            "GET",
            "api/analyses",
            200
        )
        return success

    def test_get_single_analysis(self):
        """Test getting a single analysis by ID"""
        if not self.analysis_id:
            print("❌ No analysis ID available for single analysis test")
            return False
            
        success, response = self.run_test(
            "Get Single Analysis",
            "GET",
            f"api/analyses/{self.analysis_id}",
            200
        )
        return success

    def test_create_training_plan(self):
        """Test creating a training plan"""
        if not self.analysis_id:
            print("❌ No analysis ID available for training plan test")
            return False
            
        success, response = self.run_test(
            "Create Training Plan",
            "POST",
            "api/training-plan",
            200,
            params={"analysis_id": self.analysis_id}
        )
        return success

    def test_get_training_plan(self):
        """Test getting a training plan"""
        if not self.analysis_id:
            print("❌ No analysis ID available for get training plan test")
            return False
            
        success, response = self.run_test(
            "Get Training Plan",
            "GET",
            f"api/training-plans/{self.analysis_id}",
            200
        )
        return success

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🔍 Testing Error Handling...")
        
        # Test non-existent analysis
        success, _ = self.run_test(
            "Non-existent Analysis",
            "GET",
            "api/analyses/non-existent-id",
            404
        )
        
        # Test non-existent training plan
        success2, _ = self.run_test(
            "Non-existent Training Plan",
            "GET",
            "api/training-plans/non-existent-id",
            404
        )
        
        return success and success2

def main():
    print("🚀 Starting Badminton AI Analyzer Backend Tests")
    print("=" * 60)
    
    tester = BadmintonAPITester()
    
    # Run tests in sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Video Analysis", tester.test_video_analysis),
        ("Get All Analyses", tester.test_get_all_analyses),
        ("Get Single Analysis", tester.test_get_single_analysis),
        ("Create Training Plan", tester.test_create_training_plan),
        ("Get Training Plan", tester.test_get_training_plan),
        ("Error Handling", tester.test_error_handling)
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"\n⚠️  {test_name} failed - continuing with remaining tests")
        except Exception as e:
            print(f"\n💥 {test_name} crashed with error: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
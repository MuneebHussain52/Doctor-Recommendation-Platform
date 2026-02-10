"""
Test the complete specialty management workflow
"""
import requests
import json

API_BASE_URL = "http://localhost:8000/api"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_specialty_list():
    """Test getting list of approved specialties"""
    print_section("TEST 1: Get Approved Specialties")
    
    response = requests.get(f"{API_BASE_URL}/specialties/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {len(data['specialties'])} approved specialties")
        print(f"Specialties: {', '.join(data['specialties'][:5])}...")
        return True
    else:
        print(f"✗ Failed: {response.text}")
        return False

def test_doctor_registration_with_custom_specialty():
    """Test doctor registration with custom specialty"""
    print_section("TEST 2: Doctor Registration with Custom Specialty")
    
    # Prepare registration data
    files = {
        'email': (None, 'test.specialty.doctor@example.com'),
        'password': (None, 'TestPassword123!'),
        'first_name': (None, 'John'),
        'last_name': (None, 'Smith'),
        'specialty': (None, 'Other'),
        'is_custom_specialty': (None, 'true'),
        'custom_specialty': (None, 'Sports Medicine'),
        'license_number': (None, 'LIC123456'),
        'years_of_experience': (None, '5'),
        'phone': (None, '+1234567890'),
        'gender': (None, 'male'),
        'date_of_birth': (None, '1990-01-01'),
    }
    
    # Add dummy files for required documents
    dummy_file = ('dummy.txt', b'Test document content', 'text/plain')
    files['national_id'] = dummy_file
    files['medical_degree'] = dummy_file
    files['medical_license'] = dummy_file
    files['specialist_certificates'] = dummy_file
    files['proof_of_practice'] = dummy_file
    
    response = requests.post(f"{API_BASE_URL}/auth/doctor/register/", files=files)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Doctor registered successfully")
        print(f"Doctor ID: {data['doctor']['id']}")
        print(f"Specialty: {data['doctor']['specialty']}")
        print(f"Pending Specialty: {data['doctor'].get('pending_specialty', 'N/A')}")
        return data['doctor']['id']
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_pending_specialties_list(admin_token):
    """Test getting list of pending specialties"""
    print_section("TEST 3: Get Pending Specialties (Admin)")
    
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f"{API_BASE_URL}/admin/specialties/pending/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {len(data.get('specialties', []))} pending specialties")
        if data.get('specialties'):
            for spec in data['specialties']:
                print(f"  - {spec['name']} (requested by {spec['requested_by']['first_name']} {spec['requested_by']['last_name']})")
            return data['specialties'][0]['id'] if data['specialties'] else None
        return None
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_approve_specialty(admin_token, specialty_id):
    """Test approving a specialty"""
    print_section("TEST 4: Approve Specialty (Admin)")
    
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.post(
        f"{API_BASE_URL}/admin/specialties/{specialty_id}/approve/",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Specialty approved successfully")
        print(f"Message: {data['message']}")
        print(f"Doctors updated: {data['specialty'].get('doctors_updated', 0)}")
        return True
    else:
        print(f"✗ Failed: {response.text}")
        return False

def test_specialty_list_after_approval():
    """Test that approved specialty appears in list"""
    print_section("TEST 5: Verify Specialty in Approved List")
    
    response = requests.get(f"{API_BASE_URL}/specialties/")
    
    if response.status_code == 200:
        data = response.json()
        if 'Sports Medicine' in data['specialties']:
            print(f"✓ 'Sports Medicine' found in approved specialties!")
            return True
        else:
            print(f"✗ 'Sports Medicine' NOT found in approved specialties")
            print(f"Current specialties: {', '.join(data['specialties'])}")
            return False
    else:
        print(f"✗ Failed to fetch specialties")
        return False

def test_reject_specialty(admin_token, specialty_id):
    """Test rejecting a specialty"""
    print_section("TEST 6: Reject Specialty (Admin)")
    
    headers = {
        'Authorization': f'Token {admin_token}',
        'Content-Type': 'application/json'
    }
    data = {
        'reason': 'This specialty is too specific and should be covered under a broader category.'
    }
    
    response = requests.post(
        f"{API_BASE_URL}/admin/specialties/{specialty_id}/reject/",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Specialty rejected successfully")
        print(f"Message: {result['message']}")
        return True
    else:
        print(f"✗ Failed: {response.text}")
        return False

def get_admin_token():
    """Login as admin and get token"""
    print_section("SETUP: Admin Login")
    
    # Try to login with common admin credentials
    response = requests.post(
        f"{API_BASE_URL}/admin/auth/login/",
        json={
            'email': 'admin@healthcare.com',
            'password': 'admin123'
        }
    )
    
    if response.status_code == 200:
        token = response.json().get('token')
        print(f"✓ Admin logged in successfully")
        return token
    else:
        print(f"✗ Admin login failed. Please ensure admin account exists.")
        print(f"Error: {response.text}")
        return None

def run_all_tests():
    """Run all specialty workflow tests"""
    print("\n" + "#"*60)
    print("#  SPECIALTY MANAGEMENT WORKFLOW TEST SUITE")
    print("#"*60)
    
    results = []
    
    # Test 1: Get approved specialties
    results.append(("Get Approved Specialties", test_specialty_list()))
    
    # Test 2: Register doctor with custom specialty
    doctor_id = test_doctor_registration_with_custom_specialty()
    results.append(("Doctor Registration with Custom Specialty", doctor_id is not None))
    
    # Get admin token
    admin_token = get_admin_token()
    if not admin_token:
        print("\n✗ Cannot continue tests without admin token")
        return
    
    # Test 3: Get pending specialties
    specialty_id = test_pending_specialties_list(admin_token)
    results.append(("Get Pending Specialties", specialty_id is not None))
    
    if specialty_id:
        # Test 4: Approve specialty
        results.append(("Approve Specialty", test_approve_specialty(admin_token, specialty_id)))
        
        # Test 5: Verify in approved list
        results.append(("Verify in Approved List", test_specialty_list_after_approval()))
    
    # Print summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} | {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed*100//total}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! Specialty management system is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")

if __name__ == '__main__':
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server.")
        print("Please ensure the Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()

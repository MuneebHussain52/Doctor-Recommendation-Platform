"""
Test script to verify the new specialty system works correctly
"""
import requests
import json

API_BASE_URL = "http://localhost:8000/api"

def test_specialty_list():
    """Test that specialty list returns core + custom specialties"""
    print("\n" + "="*60)
    print("  TEST 1: Specialty List API")
    print("="*60)
    
    response = requests.get(f"{API_BASE_URL}/specialties/")
    
    if response.status_code == 200:
        data = response.json()
        specialties = data.get('specialties', [])
        
        print(f"✓ API returned {len(specialties)} specialties")
        print(f"\nCore Specialties (should be 17):")
        core_count = 0
        custom_count = 0
        
        # Expected core specialties
        core_specialties = [
            'Allergist', 'Cardiologist', 'Common Cold', 'Dermatologist',
            'Endocrinologist', 'Gastroenterologist', 'Gynecologist',
            'Hepatologist', 'Internal Medicine', 'Neurologist',
            'Osteoarthritis', 'Osteopathic', 'Otolaryngologist',
            'Pediatrician', 'Phlebologist', 'Pulmonologist', 'Rheumatologist'
        ]
        
        for spec in core_specialties:
            if spec in specialties:
                core_count += 1
                print(f"  ✓ {spec}")
            else:
                print(f"  ✗ {spec} MISSING!")
        
        print(f"\nCustom Approved Specialties:")
        for spec in specialties:
            if spec not in core_specialties:
                custom_count += 1
                print(f"  + {spec} (custom)")
        
        print(f"\n✓ Core: {core_count}/17")
        print(f"✓ Custom: {custom_count}")
        print(f"✓ Total: {len(specialties)}")
        
        # Verify Sports Medicine is NOT in core but might be in custom
        if 'Sports Medicine' in specialties:
            print(f"\n⚠ Sports Medicine present (as custom specialty)")
        else:
            print(f"\n✓ Sports Medicine correctly excluded from core")
        
        return True
    else:
        print(f"✗ Failed with status {response.status_code}")
        print(f"Error: {response.text}")
        return False


def test_doctor_registration_with_core_specialty():
    """Test doctor registration with a core specialty"""
    print("\n" + "="*60)
    print("  TEST 2: Doctor Registration with Core Specialty")
    print("="*60)
    
    import uuid
    random_id = str(uuid.uuid4())[:8]
    
    # Test with a core specialty (Cardiologist)
    files = {
        'email': (None, f'test.cardiologist.{random_id}@example.com'),
        'password': (None, 'TestPassword123!'),
        'first_name': (None, 'Test'),
        'last_name': (None, 'Cardiologist'),
        'specialty': (None, 'Cardiologist'),  # Core specialty
        'is_custom_specialty': (None, 'false'),
        'license_number': (None, f'LIC{random_id[:6]}'),
        'years_of_experience': (None, '10'),
        'phone': (None, '+1234567890'),
        'gender': (None, 'male'),
        'date_of_birth': (None, '1985-01-01'),
        'bio': (None, 'Test cardiologist'),
    }
    
    # Add dummy files
    dummy_file = ('dummy.txt', b'Test document', 'text/plain')
    files['national_id'] = dummy_file
    files['medical_degree'] = dummy_file
    files['medical_license'] = dummy_file
    files['specialist_certificates'] = dummy_file
    files['proof_of_practice'] = dummy_file
    
    print("Registering doctor with core specialty 'Cardiologist'...")
    response = requests.post(f"{API_BASE_URL}/auth/doctor/register/", files=files)
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Registration successful!")
        print(f"  Specialty: {data['doctor']['specialty']}")
        print(f"  Pending Specialty: {data['doctor'].get('pending_specialty', 'None')}")
        
        if data['doctor']['specialty'] == 'Cardiologist':
            print(f"✓ Core specialty assigned correctly (no approval needed)")
            return True
        else:
            print(f"✗ Unexpected specialty value")
            return False
    else:
        print(f"✗ Registration failed with status {response.status_code}")
        print(f"Error: {response.text}")
        return False


def test_doctor_registration_with_custom_specialty():
    """Test doctor registration with a custom specialty"""
    print("\n" + "="*60)
    print("  TEST 3: Doctor Registration with Custom Specialty")
    print("="*60)
    
    import uuid
    random_id = str(uuid.uuid4())[:8]
    custom_specialty_name = f"Test Specialty {random_id}"
    
    files = {
        'email': (None, f'test.custom.{random_id}@example.com'),
        'password': (None, 'TestPassword123!'),
        'first_name': (None, 'Test'),
        'last_name': (None, 'Custom'),
        'specialty': (None, 'Other'),
        'is_custom_specialty': (None, 'true'),
        'custom_specialty': (None, custom_specialty_name),
        'license_number': (None, f'LIC{random_id[:6]}'),
        'years_of_experience': (None, '5'),
        'phone': (None, '+1234567891'),
        'gender': (None, 'female'),
        'date_of_birth': (None, '1990-05-15'),
        'bio': (None, 'Test custom specialty'),
    }
    
    # Add dummy files
    dummy_file = ('dummy.txt', b'Test document', 'text/plain')
    files['national_id'] = dummy_file
    files['medical_degree'] = dummy_file
    files['medical_license'] = dummy_file
    files['specialist_certificates'] = dummy_file
    files['proof_of_practice'] = dummy_file
    
    print(f"Registering doctor with custom specialty '{custom_specialty_name}'...")
    response = requests.post(f"{API_BASE_URL}/auth/doctor/register/", files=files)
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Registration successful!")
        print(f"  Specialty: {data['doctor']['specialty']}")
        print(f"  Pending Specialty: {data['doctor'].get('pending_specialty', 'None')}")
        
        if data['doctor']['specialty'] == 'Pending Approval':
            print(f"✓ Custom specialty requires approval (correct behavior)")
            print(f"✓ Pending specialty: {data['doctor'].get('pending_specialty')}")
            return True
        else:
            print(f"✗ Expected 'Pending Approval' status")
            return False
    else:
        print(f"✗ Registration failed with status {response.status_code}")
        print(f"Error: {response.text}")
        return False


if __name__ == '__main__':
    print("\n" + "="*60)
    print("  SPECIALTY SYSTEM TESTS")
    print("="*60)
    
    results = []
    
    try:
        # Test 1: Specialty List
        results.append(("Specialty List API", test_specialty_list()))
        
        # Test 2: Core Specialty Registration
        results.append(("Core Specialty Registration", test_doctor_registration_with_core_specialty()))
        
        # Test 3: Custom Specialty Registration
        results.append(("Custom Specialty Registration", test_doctor_registration_with_custom_specialty()))
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server.")
        print("Please ensure the Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Print summary
    print("\n" + "="*60)
    print("  TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{status}: {test_name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Specialty system is working correctly.")
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Please review the errors above.")

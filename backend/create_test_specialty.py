"""
Create a test doctor with custom specialty for UI testing
"""
import requests

API_BASE_URL = "http://localhost:8000/api"

def create_test_doctor_with_custom_specialty():
    print("\n" + "="*60)
    print("  CREATING TEST DOCTOR WITH CUSTOM SPECIALTY")
    print("="*60 + "\n")
    
    # Prepare registration data
    files = {
        'email': (None, 'pediatric.surgeon@example.com'),
        'password': (None, 'TestPassword123!'),
        'first_name': (None, 'Sarah'),
        'last_name': (None, 'Johnson'),
        'specialty': (None, 'Other'),
        'is_custom_specialty': (None, 'true'),
        'custom_specialty': (None, 'Pediatric Surgery'),
        'license_number': (None, 'LIC789012'),
        'years_of_experience': (None, '8'),
        'phone': (None, '+1987654321'),
        'gender': (None, 'female'),
        'date_of_birth': (None, '1985-05-15'),
        'bio': (None, 'Specialized in pediatric surgical procedures'),
    }
    
    # Add dummy files for required documents
    dummy_file = ('dummy.txt', b'Test document content', 'text/plain')
    files['national_id'] = dummy_file
    files['medical_degree'] = dummy_file
    files['medical_license'] = dummy_file
    files['specialist_certificates'] = dummy_file
    files['proof_of_practice'] = dummy_file
    
    print("Registering doctor with custom specialty 'Pediatric Surgery'...")
    response = requests.post(f"{API_BASE_URL}/auth/doctor/register/", files=files)
    
    if response.status_code == 201:
        data = response.json()
        print(f"\n✓ Doctor registered successfully!")
        print(f"  Doctor ID: {data['doctor']['id']}")
        print(f"  Name: Dr. {data['doctor']['first_name']} {data['doctor']['last_name']}")
        print(f"  Email: {data['doctor']['email']}")
        print(f"  Specialty: {data['doctor']['specialty']}")
        print(f"  Pending Specialty: {data['doctor'].get('pending_specialty', 'N/A')}")
        
        # Verify pending specialty was created
        print(f"\n✓ Now check the Admin Approval page to see the pending specialty request!")
        print(f"  Navigate to: http://localhost:5173/admin/approvals")
        print(f"  Look for 'Pediatric Surgery' in the 'Pending Specialty Requests' section")
        
        return True
    else:
        print(f"\n✗ Registration failed!")
        print(f"Status: {response.status_code}")
        print(f"Error: {response.text}")
        return False

if __name__ == '__main__':
    try:
        create_test_doctor_with_custom_specialty()
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server.")
        print("Please ensure the Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()

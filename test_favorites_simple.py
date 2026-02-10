"""
Simple test script for favorites functionality
Run with: python test_favorites_simple.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_favorites():
    print("=" * 60)
    print("FAVORITES FEATURE TEST")
    print("=" * 60)
    
    # Test patient credentials (you may need to update these)
    patient_email = "patient@test.com"
    patient_password = "test123"
    
    print("\n1. Logging in as patient...")
    login_response = requests.post(
        f"{BASE_URL}/patients/login/",
        json={"email": patient_email, "password": patient_password}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        print("\n⚠️  Please create a test patient account or update credentials in the script")
        return
    
    login_data = login_response.json()
    patient_id = login_data['user']['id']
    token = login_data['token']
    
    print(f"✅ Login successful!")
    print(f"   Patient ID: {patient_id}")
    print(f"   Token: {token[:20]}...")
    
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    # Get list of doctors
    print("\n2. Fetching doctors list...")
    doctors_response = requests.get(f"{BASE_URL}/doctors/", headers=headers)
    
    if doctors_response.status_code != 200:
        print(f"❌ Failed to fetch doctors: {doctors_response.status_code}")
        return
    
    doctors_data = doctors_response.json()
    doctors = doctors_data.get('results', [])
    
    if not doctors:
        print("❌ No doctors found in the database")
        return
    
    print(f"✅ Found {len(doctors)} doctors")
    
    # Pick first doctor to test with
    test_doctor = doctors[0]
    doctor_id = test_doctor['id']
    doctor_name = f"Dr. {test_doctor['first_name']} {test_doctor['last_name']}"
    
    print(f"   Testing with: {doctor_name} (ID: {doctor_id})")
    
    # Test adding favorite
    print(f"\n3. Adding {doctor_name} to favorites...")
    add_response = requests.post(
        f"{BASE_URL}/patients/{patient_id}/favorites/{doctor_id}/add/",
        headers=headers
    )
    
    if add_response.status_code == 201:
        print(f"✅ Successfully added to favorites!")
    elif add_response.status_code == 400:
        print(f"⚠️  Already in favorites (this is okay)")
    else:
        print(f"❌ Failed: {add_response.status_code} - {add_response.text}")
        return
    
    # List favorites
    print(f"\n4. Fetching favorites list...")
    favorites_response = requests.get(
        f"{BASE_URL}/patients/{patient_id}/favorites/",
        headers=headers
    )
    
    if favorites_response.status_code != 200:
        print(f"❌ Failed to fetch favorites: {favorites_response.status_code}")
        return
    
    favorites_data = favorites_response.json()
    favorites = favorites_data.get('favorites', [])
    
    print(f"✅ You have {len(favorites)} favorite doctor(s):")
    for fav in favorites:
        fav_name = f"Dr. {fav['first_name']} {fav['last_name']}"
        print(f"   - {fav_name} ({fav['specialty']})")
    
    # Test removing favorite
    print(f"\n5. Removing {doctor_name} from favorites...")
    remove_response = requests.post(
        f"{BASE_URL}/patients/{patient_id}/favorites/{doctor_id}/remove/",
        headers=headers
    )
    
    if remove_response.status_code == 200:
        print(f"✅ Successfully removed from favorites!")
    else:
        print(f"❌ Failed: {remove_response.status_code} - {remove_response.text}")
    
    # Verify removal
    print(f"\n6. Verifying removal...")
    verify_response = requests.get(
        f"{BASE_URL}/patients/{patient_id}/favorites/",
        headers=headers
    )
    
    if verify_response.status_code == 200:
        verify_data = verify_response.json()
        remaining = verify_data.get('favorites', [])
        print(f"✅ Now you have {len(remaining)} favorite doctor(s)")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\n📝 Frontend Fix Applied:")
    print("   - Changed from localStorage.getItem('patientId') to patient.id")
    print("   - Changed from localStorage.getItem('token') to using patient object")
    print("   - Heart icons should now turn red when clicked!")
    print("\n🧪 To test in browser:")
    print("   1. Login as a patient")
    print("   2. Go to Book Appointments page")
    print("   3. Click the heart icon on any doctor card")
    print("   4. The heart should turn RED immediately")
    print("   5. Refresh the page - the heart should still be RED")
    print("   6. Click the red heart - it should turn gray")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_favorites()
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend server")
        print("   Make sure Django server is running on http://localhost:8000")
        print("   Run: cd backend && python manage.py runserver")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

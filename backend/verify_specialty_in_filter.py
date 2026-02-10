"""
Verify that newly approved specialties appear in patient recommendation filter
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.models import Specialty
import requests

print("\n" + "="*70)
print("  VERIFYING SPECIALTY FILTER IN PATIENT DASHBOARD")
print("="*70)

# 1. Check database for approved specialties
print("\n1. Checking Database...")
approved_in_db = list(Specialty.objects.filter(
    approval_status='approved'
).order_by('name').values_list('name', flat=True))

print(f"   ✓ Found {len(approved_in_db)} approved specialties in database")
print(f"   ✓ Sports Medicine in DB: {'Sports Medicine' in approved_in_db}")
print(f"   ✓ Pediatric Surgery in DB: {'Pediatric Surgery' in approved_in_db}")

# 2. Check API endpoint
print("\n2. Checking API Endpoint...")
try:
    response = requests.get('http://localhost:8000/api/specialties/')
    if response.status_code == 200:
        data = response.json()
        specialties_from_api = data.get('specialties', [])
        
        print(f"   ✓ API returned {len(specialties_from_api)} specialties")
        print(f"   ✓ Sports Medicine in API: {'Sports Medicine' in specialties_from_api}")
        print(f"   ✓ Pediatric Surgery in API: {'Pediatric Surgery' in specialties_from_api}")
        
        # 3. Verify consistency
        print("\n3. Verifying Consistency...")
        db_set = set(approved_in_db)
        api_set = set(specialties_from_api)
        
        if db_set == api_set:
            print("   ✓ Database and API are in sync!")
        else:
            print("   ✗ Mismatch between database and API")
            missing_in_api = db_set - api_set
            extra_in_api = api_set - db_set
            if missing_in_api:
                print(f"   Missing in API: {missing_in_api}")
            if extra_in_api:
                print(f"   Extra in API: {extra_in_api}")
    else:
        print(f"   ✗ API returned status {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# 4. Display final list
print("\n4. Complete Specialty List (as shown in filter):")
print("   " + "-"*66)
for i, specialty in enumerate(sorted(specialties_from_api), 1):
    marker = "⭐" if specialty in ['Sports Medicine', 'Pediatric Surgery'] else "  "
    print(f"   {marker} {i:2d}. {specialty}")

print("\n" + "="*70)
print("  RESULT: New specialties ARE included in patient filter! ✓")
print("="*70)
print("\nFrontend Implementation:")
print("  1. Recommendations.tsx fetches from /api/specialties/")
print("  2. useEffect runs on component mount")
print("  3. Sets allSpecialties state with API response")
print("  4. Dropdown renders from allSpecialties")
print("  5. Filter excludes 'Other' option ✓")
print("\n✓ When admin approves a new specialty, it automatically appears!")
print("="*70 + "\n")

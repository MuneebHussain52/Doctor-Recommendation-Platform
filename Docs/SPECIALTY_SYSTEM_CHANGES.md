# Specialty System Changes - Core vs Custom Specialties

## Overview
The specialty system has been refactored to use **hardcoded core specialties** instead of storing them in the database. Only **custom specialties** (added via "Other" option) are stored in the database.

## Changes Made

### 1. Core Specialties (Hardcoded)
**File:** `backend/api/constants.py`

Core specialties are now defined as a constant list:
```python
CORE_SPECIALTIES = [
    'Allergist',
    'Cardiologist',
    'Common Cold',
    'Dermatologist',
    'Endocrinologist',
    'Gastroenterologist',
    'Gynecologist',
    'Hepatologist',
    'Internal Medicine',
    'Neurologist',
    'Osteoarthritis',
    'Osteopathic',
    'Otolaryngologist',
    'Pediatrician',
    'Phlebologist',
    'Pulmonologist',
    'Rheumatologist',
]
```

**Note:** "Sports Medicine" is excluded from core specialties as per requirements.

### 2. API Changes
**File:** `backend/api/views.py`

#### SpecialtyListAPIView
Now returns **combined list** of:
- Core specialties (from constants)
- Custom approved specialties (from database)

```python
def get(self, request):
    from api.constants import CORE_SPECIALTIES
    
    # Get core specialties (hardcoded)
    core_specialties = list(CORE_SPECIALTIES)
    
    # Get custom approved specialties from database
    custom_specialties = Specialty.objects.filter(
        approval_status='approved',
        is_predefined=False
    ).values_list('name', flat=True)
    
    # Combine and sort
    all_specialties = sorted(set(core_specialties + list(custom_specialties)))
    
    return Response({'specialties': all_specialties})
```

#### Doctor Registration
Updated to validate against:
1. Core specialties (no database lookup)
2. Approved custom specialties (database lookup)

Custom specialty workflow (via "Other" option):
1. Doctor enters custom specialty name
2. Creates pending Specialty record in database
3. Admin approves/rejects via admin panel
4. If approved, becomes available in dropdowns

### 3. Database Model
**File:** `backend/api/models.py`

Updated `Specialty` model documentation to clarify it only stores **custom specialties**:

```python
class Specialty(models.Model):
    """
    Model for managing CUSTOM medical specialties only.
    
    Core specialties are hardcoded in api.constants.CORE_SPECIALTIES 
    and do not need database storage.
    """
```

### 4. Management Command
**File:** `backend/api/management/commands/populate_specialties.py`

Command updated to **remove** old predefined specialties from database:

```bash
python manage.py populate_specialties
```

Output:
```
Cleaning up specialty database...
  Removed 17 old predefined specialties from database
  Custom specialties in database: 2
  Core specialties (hardcoded): 17

Core specialties are now managed in code (api/constants.py)
Database only stores custom specialties requested by doctors.
```

## How It Works Now

### For Doctors (Registration)
1. **Select from dropdown:** Choose from core specialties or approved custom specialties
2. **Select "Other":** 
   - Enter custom specialty name
   - System creates pending request
   - Doctor's specialty shows as "Pending Approval"
   - After admin approval, doctor's specialty updates automatically

### For Admins (Approval)
1. Navigate to Admin → Approvals → Pending Specialty Requests
2. See all custom specialty requests from doctors
3. Approve or reject each request
4. Upon approval:
   - Specialty becomes available in all dropdowns
   - All doctors with that pending specialty get it updated

### For Patients (Filtering)
1. Specialty filter shows:
   - All 17 core specialties
   - All approved custom specialties
2. Filter works seamlessly with both types

## Benefits

### ✅ Advantages
1. **No data loss on code migration:** Core specialties won't be removed when moving code
2. **Consistent availability:** Core specialties always available, no database dependency
3. **Simpler maintenance:** Update core specialties by editing constants.py
4. **Performance:** No database lookup for core specialties
5. **Clear separation:** Core vs custom specialties clearly distinguished

### 🔄 Workflow Preserved
- Doctor signup with core specialty ✓
- Doctor signup with custom specialty (Other) ✓
- Admin approval system ✓
- Specialty filtering in patient dashboard ✓
- All existing functionality intact ✓

## Database State

### Before Cleanup
- 17 predefined specialties in database
- 2 custom specialties (Pediatric Surgery, Sports Medicine)

### After Cleanup
- 0 predefined specialties in database (moved to code)
- 2 custom approved specialties:
  - Pediatric Surgery
  - Sports Medicine (previously in database, kept as custom)

## Testing Completed

✅ API endpoint returns core + custom specialties
✅ Database cleanup successful
✅ Custom specialties preserved
✅ Frontend pages (Doctor Register, Patient Recommendations) work unchanged
✅ Specialty filtering works correctly

## Migration Notes

When deploying to production:
1. Run `python manage.py populate_specialties` to clean up database
2. Core specialties will be served from code
3. Custom specialties remain in database
4. No frontend changes required (API contract unchanged)

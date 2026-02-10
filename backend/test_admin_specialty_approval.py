"""
Manual test script for admin specialty approval
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.models import Specialty, Doctor, AdminUser, Notification
from django.utils import timezone

def test_specialty_approval():
    print("\n" + "="*60)
    print("  TESTING SPECIALTY APPROVAL WORKFLOW")
    print("="*60)
    
    # Get the pending specialty
    pending_specialties = Specialty.objects.filter(approval_status='pending')
    print(f"\nPending Specialties: {pending_specialties.count()}")
    
    if not pending_specialties.exists():
        print("✗ No pending specialties found")
        return
    
    specialty = pending_specialties.first()
    print(f"\n1. Found pending specialty:")
    print(f"   ID: {specialty.id}")
    print(f"   Name: {specialty.name}")
    print(f"   Requested by: {specialty.requested_by.first_name if specialty.requested_by else 'Unknown'}")
    
    # Check doctors with this pending specialty
    doctors_waiting = Doctor.objects.filter(pending_specialty=specialty.name)
    print(f"\n2. Doctors waiting for this specialty: {doctors_waiting.count()}")
    for doc in doctors_waiting:
        print(f"   - Dr. {doc.first_name} {doc.last_name} (Specialty: {doc.specialty})")
    
    # Get admin
    admin = AdminUser.objects.first()
    if not admin:
        print("\n✗ No admin user found")
        return
    
    print(f"\n3. Admin approving: {admin.email}")
    
    # Approve the specialty
    specialty.approval_status = 'approved'
    specialty.approved_by = admin
    specialty.approved_at = timezone.now()
    specialty.save()
    
    print(f"✓ Specialty '{specialty.name}' approved!")
    
    # Update doctors
    doctors_updated = Doctor.objects.filter(
        pending_specialty=specialty.name
    ).update(
        specialty=specialty.name,
        pending_specialty=None
    )
    
    print(f"\n4. Updated {doctors_updated} doctor(s)")
    
    # Create notifications
    for doctor in Doctor.objects.filter(specialty=specialty.name):
        Notification.objects.create(
            user_type='doctor',
            user_id=doctor.id,
            notification_type='system',
            title='Specialty Approved',
            message=f'Your requested specialty "{specialty.name}" has been approved by the administrator.',
            is_read=False
        )
    
    print(f"✓ Created notifications for approved doctors")
    
    # Verify the specialty is in approved list
    approved_specialties = Specialty.objects.filter(
        approval_status='approved'
    ).values_list('name', flat=True)
    
    print(f"\n5. Total approved specialties: {len(approved_specialties)}")
    if specialty.name in approved_specialties:
        print(f"✓ '{specialty.name}' is now in approved list!")
    else:
        print(f"✗ '{specialty.name}' NOT found in approved list")
    
    # Check updated doctors
    print(f"\n6. Verifying doctor updates:")
    for doc in Doctor.objects.filter(specialty=specialty.name):
        print(f"   ✓ Dr. {doc.first_name} {doc.last_name}")
        print(f"     Specialty: {doc.specialty}")
        print(f"     Pending Specialty: {doc.pending_specialty or 'None'}")
    
    print("\n" + "="*60)
    print("  ✓ SPECIALTY APPROVAL TEST COMPLETED SUCCESSFULLY!")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_specialty_approval()

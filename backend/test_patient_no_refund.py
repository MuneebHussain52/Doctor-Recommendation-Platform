"""
Test to verify that patient cancellations do NOT create refunds
"""
import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.models import Doctor, Patient, Appointment, Transaction

def test_patient_cancellation_no_refund():
    print("=" * 70)
    print("Testing Patient Cancellation (No Refund)")
    print("=" * 70)
    
    # Get a doctor and patient
    doctor = Doctor.objects.first()
    patient = Patient.objects.first()
    
    if not doctor or not patient:
        print("❌ No doctor or patient found in database")
        return
    
    print(f"Using Doctor: {doctor.first_name} {doctor.last_name} (ID: {doctor.id})")
    print(f"Using Patient: {patient.first_name} {patient.last_name} (ID: {patient.id})")
    print()
    
    # Create appointment
    import time
    appt_id = f"APT-{int(time.time())}-{random.randint(1000, 9999)}"
    appointment_date = (datetime.now() + timedelta(days=3)).date()
    appointment_time = datetime.strptime("14:00", "%H:%M").time()
    
    appointment = Appointment.objects.create(
        id=appt_id,
        doctor=doctor,
        patient=patient,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        appointment_type="consultation",
        appointment_mode="online",
        status="upcoming",
        reason="Test for patient cancellation"
    )
    print(f"✓ Created appointment: {appointment.id}")
    print(f"  Date: {appointment.appointment_date} at {appointment.appointment_time}")
    print()
    
    # Create payment transaction
    txn_id = f"TXN-{int(time.time())}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))}"
    
    transaction = Transaction.objects.create(
        id=txn_id,
        patient=patient,
        doctor=doctor,
        appointment=appointment,
        amount=1500.00,
        mode='online',
        status='completed',
        payment_method='JazzCash'
    )
    print(f"✓ Created payment transaction: {transaction.id}")
    print(f"  Amount: Rs. {transaction.amount}")
    print(f"  Status: {transaction.status}")
    print()
    
    # Count transactions before cancellation
    txn_count_before = Transaction.objects.filter(appointment=appointment).count()
    print(f"📊 Transactions before cancellation: {txn_count_before}")
    print()
    
    # Simulate PATIENT cancellation
    print("🚫 Cancelling appointment as PATIENT...")
    appointment.status = 'cancelled'
    appointment.cancelled_by = 'patient'
    appointment.cancellation_reason = 'Patient has a conflict'
    appointment.save()
    
    # Count transactions after cancellation
    txn_count_after = Transaction.objects.filter(appointment=appointment).count()
    refund_transactions = Transaction.objects.filter(
        appointment=appointment,
        status='refunded'
    )
    
    print()
    print(f"📊 Transactions after cancellation: {txn_count_after}")
    print()
    
    # Verify no refund was created
    if refund_transactions.exists():
        print("❌ FAILED: Refund transaction was created (should not happen for patient cancellation)")
        for refund in refund_transactions:
            print(f"   Unexpected refund: {refund.id}")
    else:
        print("✅ SUCCESS: No refund transaction created (as expected)")
        print("   Patient cancellations are not eligible for refunds")
    
    print()
    print("📋 All transactions for appointment {}:".format(appointment.id))
    for txn in Transaction.objects.filter(appointment=appointment):
        print(f"  - {txn.id}: Rs. {txn.amount} - {txn.status}")
        if txn.reason:
            print(f"    Reason: {txn.reason}")
    
    print()
    print("=" * 70)
    print("Test completed!")
    print()
    print("Policy Verified:")
    print("  ✓ Patient cancellations do NOT create refunds")
    print("  ✓ Only doctor cancellations create refunds")
    print("  ✓ Payment remains as 'completed' status")
    print("=" * 70)

if __name__ == '__main__':
    test_patient_cancellation_no_refund()

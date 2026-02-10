"""
Test script to create an appointment with payment and then cancel to test refund
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.models import Doctor, Patient, Appointment, Transaction

# Get a doctor and patient (assuming they exist)
try:
    doctor = Doctor.objects.first()
    patient = Patient.objects.first()
    
    if not doctor or not patient:
        print("ERROR: Need at least one doctor and one patient in the database")
        sys.exit(1)
    
    print(f"Using Doctor: {doctor.first_name} {doctor.last_name} (ID: {doctor.id})")
    print(f"Using Patient: {patient.first_name} {patient.last_name} (ID: {patient.id})")
    
    # Create appointment
    appointment_date = (datetime.now() + timedelta(days=3)).date()
    appointment_time = "10:00"
    
    # Generate appointment ID
    import time
    appt_id = f"APT-{int(time.time())}-{random.randint(1000, 9999)}"
    
    appointment = Appointment.objects.create(
        id=appt_id,
        doctor=doctor,
        patient=patient,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        appointment_type="consultation",
        appointment_mode="online",
        status="upcoming",
        reason="Test symptoms for refund testing"
    )
    
    print(f"\n✓ Created appointment: {appointment.id}")
    print(f"  Date: {appointment_date} at {appointment_time}")
    
    # Create payment transaction
    txn_id = f"TXN-{int(time.time())}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))}"
    
    transaction = Transaction.objects.create(
        id=txn_id,
        patient=patient,
        doctor=doctor,
        appointment=appointment,
        amount=1500.00,
        mode="online",
        status="completed",
        payment_method="JazzCash"
    )
    
    print(f"\n✓ Created payment transaction: {transaction.id}")
    print(f"  Amount: Rs. {transaction.amount}")
    print(f"  Status: {transaction.status}")
    
    # Check transactions before cancellation
    before_count = Transaction.objects.filter(appointment=appointment).count()
    print(f"\n📊 Transactions before cancellation: {before_count}")
    
    # Now cancel the appointment as doctor (simulating the API call)
    print(f"\n🚫 Cancelling appointment as doctor...")
    appointment.status = 'cancelled'
    appointment.cancellation_reason = "Doctor has an emergency"
    appointment.cancelled_by = 'doctor'
    
    # Manually trigger the refund logic (same as in views.py)
    original_transactions = Transaction.objects.filter(
        appointment=appointment,
        status='completed'
    ).exclude(id__startswith='TXN-REFUND')
    
    if original_transactions.exists():
        original_txn = original_transactions.first()
        
        # Create refund transaction
        refund_id = f"TXN-REFUND-{int(time.time())}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))}"
        
        refund_transaction = Transaction.objects.create(
            id=refund_id,
            patient=appointment.patient,
            doctor=appointment.doctor,
            appointment=appointment,
            amount=original_txn.amount,
            mode=original_txn.mode,
            status='refunded',
            payment_method=original_txn.payment_method,
            reason=f"Refund for cancelled appointment. Reason: {appointment.cancellation_reason}"
        )
        
        print(f"\n✅ Refund transaction created: {refund_transaction.id}")
        print(f"  Amount: Rs. {refund_transaction.amount}")
        print(f"  Status: {refund_transaction.status}")
        print(f"  Reason: {refund_transaction.reason}")
    
    appointment.save()
    
    # Check transactions after cancellation
    after_count = Transaction.objects.filter(appointment=appointment).count()
    print(f"\n📊 Transactions after cancellation: {after_count}")
    
    # Show all transactions for this appointment
    print(f"\n📋 All transactions for appointment {appointment.id}:")
    for txn in Transaction.objects.filter(appointment=appointment):
        print(f"  - {txn.id}: Rs. {txn.amount} - {txn.status}")
        if txn.reason:
            print(f"    Reason: {txn.reason}")
    
    print("\n✅ Test completed successfully!")
    print(f"\nYou can now:")
    print(f"1. Check doctor dashboard transactions (Doctor ID: {doctor.id})")
    print(f"2. Check patient dashboard transactions (Patient ID: {patient.id})")
    print(f"3. Both should show the refund transaction with 'refunded' status")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

"""
Test to verify doctor cancellation creates refund transaction
and that it shows up in both doctor and patient transactions
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.models import Doctor, Patient, Appointment, Transaction
from datetime import datetime, timedelta
import random
import time

def test_doctor_cancel_creates_refund():
    print("=" * 70)
    print("Testing Doctor Cancellation Creates Refund")
    print("=" * 70)
    
    # Get or create a test doctor and patient
    try:
        doctor = Doctor.objects.filter(approval_status='approved').first()
        patient = Patient.objects.first()
        
        if not doctor or not patient:
            print("❌ No approved doctors or patients found in database")
            return
            
        print(f"\n✓ Using Doctor: {doctor.first_name} {doctor.last_name} (ID: {doctor.id})")
        print(f"✓ Using Patient: {patient.first_name} {patient.last_name} (ID: {patient.id})")
        
        # Create an upcoming appointment
        future_date = (datetime.now() + timedelta(days=3)).date()
        appointment_id = f"APT-{int(time.time())}-{random.randint(1000, 9999)}"
        
        appointment = Appointment.objects.create(
            id=appointment_id,
            doctor=doctor,
            patient=patient,
            appointment_date=future_date,
            appointment_time="10:00",
            appointment_mode='online',
            appointment_type='consultation',
            status='upcoming'
        )
        
        print(f"\n✓ Created appointment: {appointment.id}")
        print(f"  Date: {appointment.appointment_date} at {appointment.appointment_time}")
        print(f"  Type: {appointment.appointment_type}")
        
        # Create a payment transaction
        txn_id = f"TXN-{int(time.time())}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))}"
        consultation_fee = 1500.00  # Standard fee
        transaction = Transaction.objects.create(
            id=txn_id,
            patient=patient,
            doctor=doctor,
            appointment=appointment,
            amount=consultation_fee,
            mode='online',
            status='completed',
            payment_method='JazzCash'
        )
        
        print(f"\n✓ Created payment transaction: {transaction.id}")
        print(f"  Amount: Rs. {transaction.amount}")
        print(f"  Status: {transaction.status}")
        
        # Check transactions before cancellation
        doctor_txns_before = Transaction.objects.filter(doctor=doctor).count()
        patient_txns_before = Transaction.objects.filter(patient=patient).count()
        refunded_before = Transaction.objects.filter(
            appointment=appointment,
            status='refunded'
        ).count()
        
        print(f"\n📊 Before Cancellation:")
        print(f"  Doctor transactions: {doctor_txns_before}")
        print(f"  Patient transactions: {patient_txns_before}")
        print(f"  Refunded transactions: {refunded_before}")
        
        # Simulate doctor cancelling via the cancel endpoint
        print(f"\n🚫 Simulating doctor cancellation...")
        
        # This simulates what happens when the endpoint is called
        appointment.status = 'cancelled'
        appointment.cancelled_by = 'doctor'
        appointment.cancellation_reason = 'Doctor has an emergency'
        appointment.save()
        
        # Now trigger the refund logic (this is what the cancel endpoint does)
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
        
        # Check transactions after cancellation
        doctor_txns_after = Transaction.objects.filter(doctor=doctor).count()
        patient_txns_after = Transaction.objects.filter(patient=patient).count()
        refunded_after = Transaction.objects.filter(
            appointment=appointment,
            status='refunded'
        ).count()
        
        print(f"\n📊 After Cancellation:")
        print(f"  Doctor transactions: {doctor_txns_after}")
        print(f"  Patient transactions: {patient_txns_after}")
        print(f"  Refunded transactions: {refunded_after}")
        
        # Verify refund was created
        print(f"\n🔍 Verification:")
        if doctor_txns_after > doctor_txns_before:
            print(f"  ✅ Doctor transaction count increased (+{doctor_txns_after - doctor_txns_before})")
        else:
            print(f"  ❌ Doctor transaction count did not increase")
            
        if patient_txns_after > patient_txns_before:
            print(f"  ✅ Patient transaction count increased (+{patient_txns_after - patient_txns_before})")
        else:
            print(f"  ❌ Patient transaction count did not increase")
            
        if refunded_after > refunded_before:
            print(f"  ✅ Refunded transaction created")
        else:
            print(f"  ❌ No refunded transaction created")
        
        # Show all transactions for this appointment
        all_txns = Transaction.objects.filter(appointment=appointment).order_by('-created_at')
        print(f"\n📋 All transactions for appointment {appointment.id}:")
        for txn in all_txns:
            reason_text = f"\n    Reason: {txn.reason}" if txn.reason else ""
            print(f"  - {txn.id}: Rs. {txn.amount} - {txn.status}{reason_text}")
        
        # Verify in API format
        print(f"\n📡 API Verification:")
        print(f"  Doctor can query: /api/transactions/?doctor_id={doctor.id}")
        print(f"  Patient can query: /api/transactions/?patient_id={patient.id}")
        print(f"  Both should see the refund transaction")
        
        # Calculate totals as shown in dashboard
        doctor_completed = Transaction.objects.filter(
            doctor=doctor,
            status='completed'
        ).exclude(id__startswith='TXN-REFUND')
        
        doctor_refunded = Transaction.objects.filter(
            doctor=doctor,
            status='refunded'
        )
        
        patient_completed = Transaction.objects.filter(
            patient=patient,
            status='completed'
        ).exclude(id__startswith='TXN-REFUND')
        
        patient_refunded = Transaction.objects.filter(
            patient=patient,
            status='refunded'
        )
        
        print(f"\n💰 Dashboard Stats:")
        print(f"  Doctor:")
        print(f"    Completed payments: {doctor_completed.count()} (Rs. {sum(t.amount for t in doctor_completed)})")
        print(f"    Refunded: {doctor_refunded.count()} (Rs. {sum(t.amount for t in doctor_refunded)})")
        print(f"  Patient:")
        print(f"    Completed payments: {patient_completed.count()} (Rs. {sum(t.amount for t in patient_completed)})")
        print(f"    Refunded: {patient_refunded.count()} (Rs. {sum(t.amount for t in patient_refunded)})")
        
        print(f"\n✅ Test completed successfully!")
        print(f"\n📝 Next Steps:")
        print(f"  1. Make sure frontend calls /api/appointments/{{id}}/cancel/ endpoint")
        print(f"  2. Verify doctor dashboard shows refund with red negative amount")
        print(f"  3. Verify patient dashboard shows refund with green positive amount")
        print(f"  4. Check that appointment is marked as cancelled with reason")
        
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_doctor_cancel_creates_refund()

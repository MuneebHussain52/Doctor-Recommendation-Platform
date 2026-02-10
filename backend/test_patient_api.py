import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.serializers import AppointmentSerializer
from api.models import Appointment

# Get a patient appointment with rescheduled_by set
apt = Appointment.objects.filter(patient_id='p505021', rescheduled_by='doctor').first()

if apt:
    serialized = AppointmentSerializer(apt).data
    print("Sample patient appointment API response:")
    print(json.dumps({
        'id': serialized.get('id'),
        'status': serialized.get('status'),
        'appointment_date': str(serialized.get('appointment_date')),
        'reschedule_reason': serialized.get('reschedule_reason'),
        'rescheduled_by': serialized.get('rescheduled_by'),
        'cancellation_reason': serialized.get('cancellation_reason'),
        'cancelled_by': serialized.get('cancelled_by'),
    }, indent=2))
else:
    print("No appointment found with rescheduled_by='doctor' for patient p505021")

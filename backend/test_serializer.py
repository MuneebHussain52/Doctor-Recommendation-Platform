import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')
django.setup()

from api.serializers import AppointmentListSerializer
from api.models import Appointment

# Get an appointment with rescheduled_by set
apt = Appointment.objects.filter(rescheduled_by='doctor').first()

if apt:
    serialized = AppointmentListSerializer(apt).data
    print("Sample appointment serialized data:")
    print(json.dumps({
        'id': serialized.get('id'),
        'status': serialized.get('status'),
        'reschedule_reason': serialized.get('reschedule_reason'),
        'rescheduled_by': serialized.get('rescheduled_by'),
        'cancellation_reason': serialized.get('cancellation_reason'),
        'cancelled_by': serialized.get('cancelled_by'),
    }, indent=2))
else:
    print("No appointment found with rescheduled_by='doctor'")

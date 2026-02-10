from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from datetime import date, timedelta
from .models import Doctor, Patient, Appointment, Feedback, MedicalDocument, Symptom, Notification, AppointmentSlot, Message, FeedbackMessage, DoctorBlockingAuditLog, AdminUser, DoctorPricing, DoctorBankAccount, PatientPaymentMethod, Transaction, PaymentRequest
from .serializers import (
    DoctorSerializer, PatientSerializer,
    AppointmentSerializer, FeedbackSerializer, MedicalDocumentSerializer, SymptomSerializer, NotificationSerializer, MessageSerializer, FeedbackMessageSerializer, DoctorPricingSerializer, DoctorBankAccountSerializer, PatientPaymentMethodSerializer, TransactionSerializer, PaymentRequestSerializer
)


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'ok', 'message': 'Server is running'})


@api_view(['GET'])
def check_email(request):
    """Check if an email is already registered for a specific user type

    Query params:
      - email: the email address to check
      - user_type: 'doctor', 'patient', or 'admin' (checks only that table)

    Returns JSON: { available: true } or { available: false, message: '...' }
    """
    email = request.query_params.get('email')
    user_type = request.query_params.get('user_type')
    
    if not email:
        return Response({'error': 'Email query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not user_type or user_type not in ['doctor', 'patient', 'admin']:
        return Response({'error': 'user_type must be "doctor", "patient", or "admin"'}, status=status.HTTP_400_BAD_REQUEST)

    # Check only the specified user type
    if user_type == 'doctor':
        exists = Doctor.objects.filter(email=email).exists()
    elif user_type == 'patient':
        exists = Patient.objects.filter(email=email).exists()
    else:  # user_type == 'admin'
        exists = AdminUser.objects.filter(email=email).exists()

    if exists:
        return Response({'available': False, 'message': 'Email already registered'}, status=status.HTTP_200_OK)

    return Response({'available': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
def doctor_login(request):
    """Doctor login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        doctor = Doctor.objects.get(email=email)
        if check_password(password, doctor.password):
            # Build avatar URL if file exists
            avatar_url = request.build_absolute_uri(doctor.avatar.url) if doctor.avatar else None

            return Response({
                'message': 'Login successful',
                'doctor': {
                    'id': doctor.id,
                    'email': doctor.email,
                    'first_name': doctor.first_name,
                    'middle_name': doctor.middle_name,
                    'last_name': doctor.last_name,
                    'specialty': doctor.specialty,
                    'phone': doctor.phone,
                    'avatar': avatar_url,
                    'bio': doctor.bio,
                    'is_blocked': doctor.is_blocked,
                    'block_reason': doctor.block_reason,
                    'blocked_at': doctor.blocked_at.isoformat() if doctor.blocked_at else None,
                }
            })
        else:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except Doctor.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
def doctor_register(request):
    """Doctor registration endpoint"""
    from django.db import IntegrityError

    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if doctor already exists
    if Doctor.objects.filter(email=email).exists():
        return Response(
            {'error': 'A doctor with this email already exists'},
            status=status.HTTP_409_CONFLICT
        )

    # Check if license number already exists
    license_number = request.data.get('license_number')
    if license_number and Doctor.objects.filter(license_number=license_number).exists():
        return Response(
            {'error': 'A doctor with this license number already exists'},
            status=status.HTTP_409_CONFLICT
        )

    # Generate doctor ID
    import random
    import string
    doctor_id = 'dr' + ''.join(random.choices(string.digits, k=6))
    while Doctor.objects.filter(id=doctor_id).exists():
        doctor_id = 'dr' + ''.join(random.choices(string.digits, k=6))

    try:
        # Create doctor
        avatar_file = request.FILES.get('avatar')
        
        # Get document files
        national_id_file = request.FILES.get('national_id')
        medical_degree_file = request.FILES.get('medical_degree')
        medical_license_file = request.FILES.get('medical_license')
        specialist_certificates_file = request.FILES.get('specialist_certificates')
        proof_of_practice_file = request.FILES.get('proof_of_practice')

        # Handle specialty - check if it's a custom specialty request
        from api.constants import CORE_SPECIALTIES
        
        specialty = request.data.get('specialty', '')
        custom_specialty = request.data.get('custom_specialty', '')
        is_custom = request.data.get('is_custom_specialty', 'false').lower() == 'true'
        
        pending_specialty_name = None
        final_specialty = specialty
        
        if is_custom and custom_specialty:
            # This is a custom specialty request (via "Other" option)
            from api.models import Specialty
            
            # Check if this custom specialty already exists and is approved in database
            existing_specialty = Specialty.objects.filter(
                name__iexact=custom_specialty.strip(),
                approval_status='approved'
            ).first()
            
            if existing_specialty:
                # Use the approved custom specialty
                final_specialty = existing_specialty.name
            else:
                # Create new specialty request or use existing pending one
                specialty_request, created = Specialty.objects.get_or_create(
                    name=custom_specialty.strip(),
                    defaults={
                        'is_predefined': False,
                        'approval_status': 'pending',
                    }
                )
                pending_specialty_name = custom_specialty.strip()
                final_specialty = 'Pending Approval'  # Temporary value until specialty is approved
        elif specialty in CORE_SPECIALTIES:
            # This is a core specialty - use it directly (no database lookup needed)
            final_specialty = specialty
        else:
            # Check if it's an approved custom specialty from database
            from api.models import Specialty
            existing_specialty = Specialty.objects.filter(
                name__iexact=specialty.strip(),
                approval_status='approved'
            ).first()
            
            if existing_specialty:
                final_specialty = existing_specialty.name
            else:
                # Invalid specialty
                final_specialty = specialty

        doctor = Doctor.objects.create(
            id=doctor_id,
            email=email,
            password=make_password(password),
            first_name=request.data.get('first_name', ''),
            middle_name=request.data.get('middle_name'),
            last_name=request.data.get('last_name', ''),
            specialty=final_specialty,
            pending_specialty=pending_specialty_name,
            phone=request.data.get('phone'),
            avatar=avatar_file,
            license_number=license_number,
            years_of_experience=request.data.get('years_of_experience'),
            bio=request.data.get('bio'),
            # Add document fields
            national_id=national_id_file,
            medical_degree=medical_degree_file,
            medical_license=medical_license_file,
            specialist_certificates=specialist_certificates_file,
            proof_of_practice=proof_of_practice_file,
        )
        
        # Link specialty request to doctor if it was just created
        if pending_specialty_name:
            from api.models import Specialty
            Specialty.objects.filter(name=pending_specialty_name).update(requested_by=doctor)

        # Build avatar URL if file was uploaded
        avatar_url = request.build_absolute_uri(doctor.avatar.url) if doctor.avatar else None

        return Response({
            'message': 'Registration successful',
            'doctor': {
                'id': doctor.id,
                'email': doctor.email,
                'first_name': doctor.first_name,
                'middle_name': doctor.middle_name,
                'last_name': doctor.last_name,
                'specialty': doctor.specialty,
                'phone': doctor.phone,
                'avatar': avatar_url,
                'bio': doctor.bio,
                'national_id': request.build_absolute_uri(doctor.national_id.url) if doctor.national_id else None,
                'medical_degree': request.build_absolute_uri(doctor.medical_degree.url) if doctor.medical_degree else None,
                'medical_license': request.build_absolute_uri(doctor.medical_license.url) if doctor.medical_license else None,
                'specialist_certificates': request.build_absolute_uri(doctor.specialist_certificates.url) if doctor.specialist_certificates else None,
                'proof_of_practice': request.build_absolute_uri(doctor.proof_of_practice.url) if doctor.proof_of_practice else None,
            }
        }, status=status.HTTP_201_CREATED)

    except IntegrityError as e:
        # Handle any database constraint violations
        error_message = str(e)
        if 'license_number' in error_message:
            return Response(
                {'error': 'A doctor with this license number already exists'},
                status=status.HTTP_409_CONFLICT
            )
        elif 'email' in error_message:
            return Response(
                {'error': 'A doctor with this email already exists'},
                status=status.HTTP_409_CONFLICT
            )
        else:
            return Response(
                {'error': 'Registration failed due to a database constraint. Please check your data and try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
def patient_login(request):
    """Patient login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        patient = Patient.objects.get(email=email)
        if check_password(password, patient.password):
            # Get or create authentication token
            from rest_framework.authtoken.models import Token
            from api.models import AdminUser
            
            # Get or create an AdminUser for this patient (for token authentication)
            full_name = f"{patient.first_name} {patient.last_name}".strip()
            user, created = AdminUser.objects.get_or_create(
                email=f"patient_{patient.id}@system.local",  # Use unique email
                defaults={
                    'full_name': full_name or 'Patient User',
                    'is_staff': False,
                    'is_superuser': False,
                }
            )
            
            # Generate token for the user
            token, _ = Token.objects.get_or_create(user=user)
            
            # Build avatar URL if file exists
            avatar_url = request.build_absolute_uri(patient.avatar.url) if patient.avatar else None

            return Response({
                'message': 'Login successful',
                'token': token.key,
                'patient': {
                    'id': patient.id,
                    'email': patient.email,
                    'first_name': patient.first_name,
                    'middle_name': patient.middle_name,
                    'last_name': patient.last_name,
                    'phone': patient.phone,
                    'avatar': avatar_url,
                    'gender': patient.gender,
                    'date_of_birth': patient.date_of_birth,
                    'blood_type': patient.blood_type,
                    'emergency_contact_name': patient.emergency_contact_name,
                    'emergency_contact_phone': patient.emergency_contact_phone,
                    'time_format': patient.time_format,
                    'date_format': patient.date_format,
                }
            })
        else:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
def patient_register(request):
    """Patient registration endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if patient already exists
    if Patient.objects.filter(email=email).exists():
        return Response(
            {'error': 'A patient with this email already exists'},
            status=status.HTTP_409_CONFLICT
        )

    # Generate patient ID
    import random
    import string
    patient_id = 'p' + ''.join(random.choices(string.digits, k=6))
    while Patient.objects.filter(id=patient_id).exists():
        patient_id = 'p' + ''.join(random.choices(string.digits, k=6))

    # Create patient
    avatar_file = request.FILES.get('avatar')

    patient = Patient.objects.create(
        id=patient_id,
        email=email,
        password=make_password(password),
        first_name=request.data.get('first_name', ''),
        middle_name=request.data.get('middle_name'),
        last_name=request.data.get('last_name', ''),
        phone=request.data.get('phone'),
        avatar=avatar_file,
        gender=request.data.get('gender'),
        date_of_birth=request.data.get('date_of_birth'),
    )

    # Build avatar URL if file was uploaded
    avatar_url = request.build_absolute_uri(patient.avatar.url) if patient.avatar else None

    return Response({
        'message': 'Registration successful',
        'patient': {
            'id': patient.id,
            'email': patient.email,
            'first_name': patient.first_name,
            'middle_name': patient.middle_name,
            'last_name': patient.last_name,
            'phone': patient.phone,
            'avatar': avatar_url,
            'gender': patient.gender,
            'date_of_birth': patient.date_of_birth,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def patient_change_password(request):
    """Patient change password endpoint"""
    patient_id = request.data.get('patient_id')
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not all([patient_id, current_password, new_password]):
        return Response(
            {'error': 'Patient ID, current password, and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        patient = Patient.objects.get(id=patient_id)

        # Verify current password
        if not check_password(current_password, patient.password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update to new password
        patient.password = make_password(new_password)
        patient.save()

        # Create a system notification for password change
        from .models import PatientNotification
        PatientNotification.objects.create(
            patient=patient,
            category='system',
            title='Password Changed',
            message='Your password has been successfully changed.'
        )

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

    except Patient.DoesNotExist:
        return Response(
            {'error': 'Patient not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer

    def get_queryset(self):
        """
        Filter queryset based on the action:
        - For list view (patient search): Only show approved, non-blocked doctors with bank accounts AND pricing set
        - For retrieve/update/delete: Allow doctor to access their own data even if blocked
        """
        if self.action == 'list':
            # Patient-facing view: hide blocked doctors and those without bank accounts or pricing
            from django.db.models import Exists, OuterRef, Q
            
            # Subquery to check if doctor has at least one bank account
            has_bank = DoctorBankAccount.objects.filter(doctor=OuterRef('pk'))
            
            # Subquery to check if doctor has pricing set (both online and in-person must be > 0)
            has_pricing = DoctorPricing.objects.filter(
                doctor=OuterRef('pk'),
                online_fee__gt=0,
                in_person_fee__gt=0
            )
            
            return Doctor.objects.filter(
                is_blocked=False, 
                approval_status='approved'
            ).annotate(
                has_bank_account=Exists(has_bank),
                has_pricing_set=Exists(has_pricing)
            ).filter(has_bank_account=True, has_pricing_set=True).select_related('pricing')
        else:
            # Doctor accessing their own data: show all (including blocked)
            return Doctor.objects.all().select_related('pricing')

    def update(self, request, *args, **kwargs):
        """Override update to clean up old avatar and document files"""
        import os
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Store old file paths before update
        old_avatar = instance.avatar.name if instance.avatar else None
        old_files = {
            'national_id': instance.national_id.name if instance.national_id else None,
            'medical_degree': instance.medical_degree.name if instance.medical_degree else None,
            'medical_license': instance.medical_license.name if instance.medical_license else None,
            'specialist_certificates': instance.specialist_certificates.name if instance.specialist_certificates else None,
            'proof_of_practice': instance.proof_of_practice.name if instance.proof_of_practice else None,
        }

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Check if avatar is being updated or removed
        if 'avatar' in request.data or request.FILES.get('avatar'):
            # Delete old avatar file if it exists and is being replaced
            if old_avatar:
                try:
                    if os.path.isfile(instance.avatar.path):
                        os.remove(instance.avatar.path)
                        print(f"[Cleanup] Deleted old doctor avatar: {old_avatar}")
                except Exception as e:
                    print(f"[Cleanup] Could not delete old doctor avatar: {e}")

        # Check if any document is being updated or removed
        document_fields = ['national_id', 'medical_degree', 'medical_license', 'specialist_certificates', 'proof_of_practice']
        for field in document_fields:
            if field in request.data or request.FILES.get(field):
                # Delete old document file if it exists and is being replaced
                if old_files[field]:
                    try:
                        old_field_value = getattr(instance, field)
                        if old_field_value and os.path.isfile(old_field_value.path):
                            os.remove(old_field_value.path)
                            print(f"[Cleanup] Deleted old doctor {field}: {old_files[field]}")
                    except Exception as e:
                        print(f"[Cleanup] Could not delete old doctor {field}: {e}")

        self.perform_update(serializer)

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update and create system notification"""
        kwargs['partial'] = True
        doctor = self.get_object()

        # Track what changed with custom messages for each field
        changes = []

        # Profile fields
        if 'first_name' in request.data and doctor.first_name != request.data['first_name']:
            changes.append("First name")

        if 'middle_name' in request.data and doctor.middle_name != request.data.get('middle_name', ''):
            changes.append("Middle name")

        if 'last_name' in request.data and doctor.last_name != request.data['last_name']:
            changes.append("Last name")

        if 'email' in request.data and doctor.email != request.data['email']:
            changes.append("Email")

        if 'phone' in request.data and doctor.phone != request.data['phone']:
            changes.append("Phone number")

        if 'specialty' in request.data and doctor.specialty != request.data['specialty']:
            changes.append("Specialty")

        if 'bio' in request.data and doctor.bio != request.data.get('bio', ''):
            changes.append("Bio")

        # Check for avatar changes (base64 upload or removal)
        if 'avatar' in request.data:
            avatar_data = request.data.get('avatar')
            # Check if it's a removal (empty string or None)
            if avatar_data == '' or avatar_data is None:
                changes.append("Profile picture removed")
            # Check if it's a new upload (base64 string)
            elif isinstance(avatar_data, str) and avatar_data.startswith('data:image'):
                changes.append("Profile picture updated")
        # Also check for traditional file uploads (multipart/form-data)
        elif 'avatar' in request.FILES:
            changes.append("Profile picture updated")

        # Document fields
        document_fields = {
            'national_id': 'National ID',
            'medical_degree': 'Medical Degree',
            'medical_license': 'Medical License',
            'specialist_certificates': 'Specialist Certificates',
            'proof_of_practice': 'Proof of Practice'
        }
        
        for field_name, display_name in document_fields.items():
            if field_name in request.FILES:
                changes.append(f"{display_name} uploaded")
            elif field_name in request.data:
                # Check if it's being removed (empty string)
                if request.data.get(field_name) == '':
                    changes.append(f"{display_name} removed")

        # Settings fields
        if 'appointment_interval' in request.data:
            old_interval = doctor.appointment_interval
            new_interval = request.data['appointment_interval']
            if old_interval != new_interval:
                changes.append("Appointment duration")

        if 'time_format' in request.data:
            old_format = doctor.time_format
            new_format = request.data['time_format']
            if old_format != new_format:
                changes.append("Time format")

        if 'date_format' in request.data:
            old_format = doctor.date_format
            new_format = request.data['date_format']
            if old_format != new_format:
                changes.append("Date format")

        response = self.update(request, *args, **kwargs)

        # Create system notification if any settings changed
        if response.status_code == 200 and changes:
            from .models import Notification
            try:
                # Create notification message
                if len(changes) == 1:
                    message = f"{changes[0]} has been updated."
                elif len(changes) == 2:
                    message = f"{changes[0]} and {changes[1]} have been updated."
                else:
                    message = f"{', '.join(changes[:-1])}, and {changes[-1]} have been updated."

                # Determine title based on what changed
                profile_fields = ['first_name', 'last_name', 'email', 'phone', 'specialty', 'bio', 'avatar', 'middle_name']
                is_profile_change = any(field in request.data or field in request.FILES for field in profile_fields)

                Notification.objects.create(
                    user_type='doctor',
                    user_id=str(doctor.id),
                    notification_type='system',
                    title='Profile Updated' if is_profile_change else 'Settings Updated',
                    message=message
                )
                print(f"[DoctorViewSet] Created notification for doctor {doctor.id}: {message}")
            except Exception as e:
                print(f"[DoctorViewSet] Error creating system notification: {e}")

        return response


    @action(detail=True, methods=['get'])
    def dashboard_stats(self, request, pk=None):
        """Get dashboard statistics for a doctor"""
        doctor = self.get_object()
        today = date.today()

        # Today's appointments
        todays_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=today,
            status__in=['upcoming', 'completed']
        ).count()

        # Total patients (completed appointments)
        total_patients = Appointment.objects.filter(
            doctor=doctor,
            status='completed'
        ).count()

        # Average rating
        feedback_stats = Feedback.objects.filter(doctor=doctor).aggregate(
            avg_rating=Avg('rating'),
            total_ratings=Count('id')
        )

        # This week's consultations
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        this_week_consultations = Appointment.objects.filter(
            doctor=doctor,
            status='completed',
            appointment_date__gte=week_start,
            appointment_date__lte=week_end
        ).count()

        return Response({
            'todaysAppointments': todays_appointments,
            'totalPatients': total_patients,
            'averageRating': round(feedback_stats['avg_rating'] or 0, 1),
            'totalRatings': feedback_stats['total_ratings'],
            'thisWeekConsultations': this_week_consultations
        })

    @action(detail=True, methods=['get'])
    def appointments(self, request, pk=None):
        """Get appointments for a doctor"""
        doctor = self.get_object()
        status_filter = request.query_params.get('status', None)

        appointments = Appointment.objects.filter(doctor=doctor).select_related('patient', 'doctor', 'location')
        if status_filter:
            appointments = appointments.filter(status=status_filter)

        # Sort by date (ascending) then by time (ascending) for proper chronological order
        appointments = appointments.order_by('appointment_date', 'appointment_time')

        serializer = AppointmentSerializer(appointments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def feedback(self, request, pk=None):
        """Get feedback for a doctor"""
        doctor = self.get_object()
        limit = int(request.query_params.get('limit', 10))

        feedback = Feedback.objects.filter(doctor=doctor)[:limit]
        serializer = FeedbackSerializer(feedback, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-specialty')
    def by_specialty(self, request):
        """
        Get ranked doctors filtered by specialty
        Query params:
        - specialty: Required. The specialty to filter by

        Returns ALL approved and non-blocked doctors sorted by ranking score (rating, experience, feedback count)
        """
        from api.ranking_service import DoctorRankingService

        specialty = request.query_params.get('specialty')

        if not specialty:
            return Response(
                {'error': 'specialty parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter doctors by specialty (case-insensitive), approved and non-blocked
        doctors = Doctor.objects.filter(
            specialty__iexact=specialty,
            approval_status='approved',
            is_blocked=False
        )

        # Calculate ranking scores for each doctor
        doctor_scores = []
        for doctor in doctors:
            score = DoctorRankingService.calculate_score(
                doctor=doctor,
                predicted_specialty=specialty  # Bonus for matching specialty
            )
            doctor_scores.append((doctor, score))

        # Sort by ranking score (highest first) - return all doctors
        doctor_scores.sort(key=lambda x: x[1], reverse=True)

        # Serialize all doctors with predicted_specialty in context for ranking
        doctors_ranked = [doctor for doctor, score in doctor_scores]
        serializer = self.get_serializer(
            doctors_ranked,
            many=True,
            context={'request': request, 'predicted_specialty': specialty}
        )

        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def hospital_locations(self, request, pk=None):
        """Get or create hospital locations for a doctor"""
        from .models import HospitalLocation
        from .serializers import HospitalLocationSerializer

        doctor = self.get_object()

        if request.method == 'GET':
            locations = HospitalLocation.objects.filter(doctor=doctor, is_active=True)
            serializer = HospitalLocationSerializer(locations, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            # Create a mutable copy of request data
            data = dict(request.data)
            data['doctor'] = doctor.id
            serializer = HospitalLocationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            # Return detailed error for debugging
            print(f"[HospitalLocation] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], url_path='hospital_locations/(?P<location_id>[^/.]+)')
    def update_hospital_location(self, request, pk=None, location_id=None):
        """Update a hospital location"""
        from .models import HospitalLocation
        from .serializers import HospitalLocationSerializer

        doctor = self.get_object()
        try:
            location = HospitalLocation.objects.get(id=location_id, doctor=doctor)
            serializer = HospitalLocationSerializer(location, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except HospitalLocation.DoesNotExist:
            return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'], url_path='hospital_locations/(?P<location_id>[^/.]+)/delete')
    def delete_hospital_location(self, request, pk=None, location_id=None):
        """Delete a hospital location"""
        from .models import HospitalLocation

        doctor = self.get_object()
        try:
            location = HospitalLocation.objects.get(id=location_id, doctor=doctor)
            location.is_active = False
            location.save()
            return Response({'message': 'Location deleted successfully'})
        except HospitalLocation.DoesNotExist:
            return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get', 'post'])
    def appointment_slots(self, request, pk=None):
        """Get or create appointment slots for a doctor"""
        from .models import AppointmentSlot
        from .serializers import AppointmentSlotSerializer

        doctor = self.get_object()

        if request.method == 'GET':
            slots = AppointmentSlot.objects.filter(doctor=doctor, is_active=True)
            serializer = AppointmentSlotSerializer(slots, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            data['doctor'] = doctor.id
            serializer = AppointmentSlotSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='appointment_slots/(?P<slot_id>[^/.]+)/delete')
    def delete_appointment_slot(self, request, pk=None, slot_id=None):
        """Delete an appointment slot"""
        from .models import AppointmentSlot

        doctor = self.get_object()
        try:
            slot = AppointmentSlot.objects.get(id=slot_id, doctor=doctor)
            slot.is_active = False
            slot.save()
            return Response({'message': 'Appointment slot deleted successfully'})
        except AppointmentSlot.DoesNotExist:
            return Response({'error': 'Slot not found'}, status=status.HTTP_404_NOT_FOUND)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def update(self, request, *args, **kwargs):
        """Override update to handle avatar URL in response and create notification"""
        import os
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Store old values before update to detect changes
        old_avatar = instance.avatar.name if instance.avatar else None
        old_values = {
            'first_name': instance.first_name,
            'middle_name': instance.middle_name,
            'last_name': instance.last_name,
            'phone': instance.phone,
            'gender': instance.gender,
            'blood_type': instance.blood_type,
            'emergency_contact_name': instance.emergency_contact_name,
            'emergency_contact_phone': instance.emergency_contact_phone,
            'time_format': instance.time_format,
            'date_format': instance.date_format,
        }

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Check if avatar is being updated or removed (base64 or file upload)
        avatar_in_data = 'avatar' in request.data
        avatar_in_files = request.FILES.get('avatar')

        if avatar_in_data or avatar_in_files:
            # Delete old avatar file if it exists and is being replaced
            avatar_data = request.data.get('avatar') if avatar_in_data else None
            # Only delete old avatar if we're uploading a new one (not removing)
            if old_avatar and (avatar_in_files or (isinstance(avatar_data, str) and avatar_data.startswith('data:image'))):
                try:
                    if os.path.isfile(instance.avatar.path):
                        os.remove(instance.avatar.path)
                        print(f"[Cleanup] Deleted old avatar: {old_avatar}")
                except Exception as e:
                    print(f"[Cleanup] Could not delete old avatar: {e}")

        self.perform_update(serializer)

        # Detect what changed and create detailed notification message
        changes = []
        field_labels = {
            'first_name': 'First name',
            'middle_name': 'Middle name',
            'last_name': 'Last name',
            'phone': 'Phone number',
            'gender': 'Gender',
            'blood_type': 'Blood type',
            'emergency_contact_name': 'Emergency contact name',
            'emergency_contact_phone': 'Emergency contact phone',
            'time_format': 'Time format',
            'date_format': 'Date format',
        }

        for field, old_value in old_values.items():
            new_value = getattr(instance, field)
            if old_value != new_value:
                changes.append(field_labels.get(field, field))

        # Check if avatar changed (base64 or file upload)
        if avatar_in_data or avatar_in_files:
            if old_avatar != (instance.avatar.name if instance.avatar else None):
                changes.append('Profile picture')

        # Create notification with specific changes
        if changes:
            if len(changes) == 1:
                message = f'{changes[0]} has been updated.'
            elif len(changes) == 2:
                message = f'{changes[0]} and {changes[1]} have been updated.'
            else:
                message = f'{", ".join(changes[:-1])}, and {changes[-1]} have been updated.'
        else:
            message = 'Your profile information has been successfully updated.'

        from .models import PatientNotification
        PatientNotification.objects.create(
            patient=instance,
            category='system',
            title='Profile Updated',
            message=message
        )

        # Build avatar URL if file exists
        response_data = serializer.data
        if instance.avatar:
            response_data['avatar'] = request.build_absolute_uri(instance.avatar.url)
        else:
            response_data['avatar'] = None

        return Response(response_data)

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to handle avatar URL in response"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def dashboard_stats(self, request, pk=None):
        """Get dashboard statistics for a patient"""
        patient = self.get_object()
        today = date.today()
        month_start = today.replace(day=1)

        # Total appointments
        total_appointments = Appointment.objects.filter(patient=patient).count()

        # Upcoming appointments
        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            status='upcoming'
        ).count()

        # This month appointments
        this_month_appointments = Appointment.objects.filter(
            patient=patient,
            created_at__gte=month_start
        ).count()

        # Feedback given
        completed_appointments = Appointment.objects.filter(
            patient=patient,
            status='completed'
        )
        feedback_given = Feedback.objects.filter(
            patient=patient,
            appointment__in=completed_appointments
        ).count()

        # Pending feedback
        pending_feedback = completed_appointments.count() - feedback_given

        return Response({
            'totalAppointments': total_appointments,
            'upcomingAppointments': upcoming_appointments,
            'thisMonthAppointments': this_month_appointments,
            'completedFeedback': feedback_given,
            'pendingFeedback': pending_feedback
        })

    @action(detail=True, methods=['get'])
    def appointments(self, request, pk=None):
        """Get appointments for a patient"""
        patient = self.get_object()
        status_filter = request.query_params.get('status', None)

        appointments = Appointment.objects.filter(patient=patient).select_related('patient', 'doctor', 'location')
        if status_filter:
            appointments = appointments.filter(status=status_filter)

        serializer = AppointmentSerializer(appointments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get medical documents for a patient"""
        patient = self.get_object()
        documents = MedicalDocument.objects.filter(patient=patient)

        # Build absolute URLs for files
        docs_data = []
        for doc in documents:
            doc_dict = {
                'id': str(doc.id),
                'document_name': doc.document_name,
                'category': doc.category,
                'file_size': doc.file_size,
                'uploaded_at': doc.uploaded_at.isoformat(),
                'document_file': request.build_absolute_uri(doc.file.url) if doc.file else None,
                'file_url': request.build_absolute_uri(doc.file.url) if doc.file else None,
                'appointment': doc.appointment.id if doc.appointment else None  # Include appointment link
            }
            docs_data.append(doc_dict)

        return Response(docs_data)

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Upload a medical document"""
        import os
        patient = self.get_object()

        file = request.FILES.get('file')
        document_name = request.data.get('document_name')
        category = request.data.get('category', 'Other')
        appointment_id = request.data.get('appointment')  # Get appointment ID if provided

        if not file or not document_name:
            return Response(
                {'error': 'File and document name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file extension
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt', 'dcm', 'xlsx', 'csv', 'tiff', 'tif', 'xls', 'rtf', 'bmp']
        file_ext = file.name.split('.')[-1].lower() if '.' in file.name else ''

        if file_ext not in allowed_extensions:
            return Response(
                {'error': f'File type .{file_ext} is not allowed. Allowed types: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate file size
        file_size = file.size

        # Create document with appointment link if provided
        document_data = {
            'patient': patient,
            'document_name': document_name,
            'category': category,
            'file': file,
            'file_size': file_size
        }

        # Link to appointment if appointment_id is provided
        if appointment_id:
            try:
                from .models import Appointment
                appointment = Appointment.objects.get(id=appointment_id)
                document_data['appointment'] = appointment
            except Appointment.DoesNotExist:
                pass  # Continue without linking if appointment not found

        document = MedicalDocument.objects.create(**document_data)

        return Response({
            'id': str(document.id),
            'document_name': document.document_name,
            'category': document.category,
            'file_size': document.file_size,
            'uploaded_at': document.uploaded_at.isoformat(),
            'file_url': request.build_absolute_uri(document.file.url),
            'appointment': str(document.appointment.id) if document.appointment else None
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='documents/(?P<document_id>[^/.]+)')
    def delete_document(self, request, pk=None, document_id=None):
        """Delete a medical document"""
        import os
        patient = self.get_object()

        try:
            document = MedicalDocument.objects.get(id=document_id, patient=patient)

            # Delete file from filesystem
            if document.file:
                try:
                    if os.path.isfile(document.file.path):
                        os.remove(document.file.path)
                        print(f"[Cleanup] Deleted document file: {document.file.name}")
                except Exception as e:
                    print(f"[Cleanup] Could not delete document file: {e}")

            document.delete()
            return Response({'message': 'Document deleted successfully'}, status=status.HTTP_200_OK)
        except MedicalDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def symptoms(self, request, pk=None):
        """Get symptom history for a patient"""
        patient = self.get_object()
        symptoms = Symptom.objects.filter(patient=patient)
        serializer = SymptomSerializer(symptoms, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_symptom(self, request, pk=None):
        """Submit a symptom"""
        patient = self.get_object()
        data = request.data.copy()
        data['patient'] = patient.id
        serializer = SymptomSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='feedback')
    def get_feedback(self, request, pk=None):
        """Get all feedback submitted by this patient"""
        from .models import Feedback
        from .serializers import FeedbackSerializer

        feedbacks = Feedback.objects.filter(patient_id=pk).order_by('-created_at')
        serializer = FeedbackSerializer(feedbacks, many=True, context={'request': request})
        return Response(serializer.data)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related('patient', 'doctor', 'location')
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        """Filter appointments by query parameters"""
        queryset = Appointment.objects.all().select_related('patient', 'doctor', 'location')
        
        # Filter by doctor if provided
        doctor_id = self.request.query_params.get('doctor', None)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # Filter by patient if provided
        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by appointment_date if provided
        appointment_date = self.request.query_params.get('appointment_date', None)
        if appointment_date:
            queryset = queryset.filter(appointment_date=appointment_date)
        
        # Filter by status if provided
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new appointment"""
        from datetime import datetime

        doctor_id = request.data.get('doctor')
        appointment_date = request.data.get('appointment_date')
        appointment_time = request.data.get('appointment_time')

        # Validate doctor exists
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate appointment is during doctor's appointment slots
        date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        day_of_week = date_obj.strftime('%A')
        appointment_mode = request.data.get('appointment_mode', 'in-person')

        # Get appointment slots for this day and mode
        appointment_slots = AppointmentSlot.objects.filter(
            doctor=doctor,
            day_of_week=day_of_week,
            is_active=True,
            mode=appointment_mode
        )

        if not appointment_slots.exists():
            return Response(
                {'error': f'Doctor is not available on {day_of_week}s for {appointment_mode} appointments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate time is within one of the appointment slots
        time_obj = datetime.strptime(appointment_time, '%H:%M').time()
        valid_slot = None
        for slot in appointment_slots:
            if slot.start_time <= time_obj < slot.end_time:
                valid_slot = slot
                break

        if not valid_slot:
            return Response(
                {'error': f'Selected time is not available for {appointment_mode} appointments on {day_of_week}s'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if time slot is already booked for this mode
        existing = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            appointment_mode=appointment_mode
        ).exclude(status='cancelled').exists()

        if existing:
            return Response(
                {'error': f'Time slot is already booked for {appointment_mode} appointments'},
                status=status.HTTP_409_CONFLICT
            )

        # Create the appointment
        response = super().create(request, *args, **kwargs)

        # If successful, create notifications
        if response.status_code == 201:
            from .models import Notification, Patient
            appointment_data = response.data
            patient_id = request.data.get('patient')

            try:
                patient = Patient.objects.get(id=patient_id)
                appointment_mode = request.data.get('appointment_mode', 'online')
                location_info = ""

                if appointment_mode == 'in-person' and appointment_data.get('location_info'):
                    location_info = f" at {appointment_data['location_info']['name']}"

                # Notification for patient
                Notification.objects.create(
                    user_type='patient',
                    user_id=patient_id,
                    notification_type='booking',
                    title='Appointment Booked Successfully',
                    message=f'Your {appointment_mode} appointment with Dr. {doctor.first_name} {doctor.last_name} is confirmed for {appointment_date} at {appointment_time}{location_info}.',
                    related_appointment_id=appointment_data['id']
                )

                # Notification for doctor
                Notification.objects.create(
                    user_type='doctor',
                    user_id=doctor_id,
                    notification_type='booking',
                    title='New Appointment Booking',
                    message=f'New {appointment_mode} appointment booked by {patient.first_name} {patient.last_name} for {appointment_date} at {appointment_time}{location_info}.',
                    related_appointment_id=appointment_data['id']
                )
            except Exception as e:
                print(f"Error creating notifications: {e}")

        return response

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update appointment status"""
        appointment = self.get_object()
        appointment.status = request.data.get('status')
        appointment.notes = request.data.get('notes', appointment.notes)
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Cancel an appointment with optional reason"""
        appointment = self.get_object()

        # Check if appointment can be cancelled
        if appointment.status == 'cancelled':
            return Response(
                {'error': 'Appointment is already cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment.status == 'completed':
            return Response(
                {'error': 'Cannot cancel a completed appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get who is cancelling
        cancelled_by = request.data.get('cancelled_by')
        
        # If doctor is cancelling, create a refund transaction for the original payment
        if cancelled_by == 'doctor':
            # Find the original payment transaction for this appointment
            original_transactions = Transaction.objects.filter(
                appointment=appointment,
                status='completed'
            ).exclude(id__startswith='TXN-REFUND')
            
            if original_transactions.exists():
                original_txn = original_transactions.first()
                
                # Create refund transaction
                import time
                import random
                refund_id = f"TXN-REFUND-{int(time.time())}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))}"
                
                cancellation_reason = request.data.get('cancellation_reason', 'Doctor cancelled appointment')
                
                refund_transaction = Transaction.objects.create(
                    id=refund_id,
                    patient=appointment.patient,
                    doctor=appointment.doctor,
                    appointment=appointment,
                    amount=original_txn.amount,
                    mode=original_txn.mode,
                    status='refunded',
                    payment_method=original_txn.payment_method,
                    reason=f"Refund for cancelled appointment. Reason: {cancellation_reason}"
                )
                
                # Credit the refund amount to patient's wallet balance
                patient = appointment.patient
                patient.wallet_balance += original_txn.amount
                patient.save()
                
                print(f"Refund transaction created: {refund_id} for amount Rs. {original_txn.amount}")
                print(f"Patient {patient.id} wallet balance updated to Rs. {patient.wallet_balance}")

        # Update appointment status
        appointment.status = 'cancelled'
        cancellation_reason = request.data.get('cancellation_reason')
        if cancellation_reason:
            appointment.cancellation_reason = cancellation_reason
        if cancelled_by:
            appointment.cancelled_by = cancelled_by
        appointment.save()

        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def create(self, request, *args, **kwargs):
        """Submit feedback"""
        appointment_id = request.data.get('appointment')

        # Check if appointment is completed or cancelled
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            if appointment.status not in ['completed', 'cancelled']:
                return Response(
                    {'error': 'Can only provide feedback for completed or cancelled appointments'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if feedback already exists
            if Feedback.objects.filter(appointment=appointment).exists():
                return Response(
                    {'error': 'Feedback already submitted for this appointment'},
                    status=status.HTTP_409_CONFLICT
                )

        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Update feedback (rating, comment, patient_reply, doctor_reply, and/or doctor_reply_to_patient)"""
        from django.utils import timezone
        feedback = self.get_object()

        # Only allow updating rating, comment, patient_reply, doctor_reply, and doctor_reply_to_patient
        allowed_fields = ['rating', 'comment', 'patient_reply', 'doctor_reply', 'doctor_reply_to_patient']
        for field in request.data.keys():
            if field not in allowed_fields:
                return Response(
                    {'error': f'Cannot update field: {field}. Only rating, comment, patient_reply, doctor_reply, and doctor_reply_to_patient can be updated.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate rating if provided
        if 'rating' in request.data:
            rating = request.data.get('rating')
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be an integer between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate comment if provided
        if 'comment' in request.data:
            comment = request.data.get('comment')
            if not comment or len(comment.strip()) < 10:
                return Response(
                    {'error': 'Comment must be at least 10 characters'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate patient_reply if provided
        if 'patient_reply' in request.data:
            patient_reply = request.data.get('patient_reply')
            if patient_reply and len(patient_reply.strip()) < 5:
                return Response(
                    {'error': 'Patient reply must be at least 5 characters'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Set timestamps based on what's being updated
        now = timezone.now()
        if 'rating' in request.data or 'comment' in request.data:
            feedback.updated_at = now

        if 'doctor_reply' in request.data:
            if request.data.get('doctor_reply'):  # If setting/updating reply
                feedback.doctor_reply_at = now
                feedback.doctor_reply_deleted_at = None  # Clear deletion timestamp when re-adding
            else:  # If deleting reply (setting to null)
                feedback.doctor_reply_deleted_at = now
                feedback.doctor_reply_at = None

        if 'patient_reply' in request.data:
            if request.data.get('patient_reply'):  # If setting/updating reply
                feedback.patient_reply_at = now
                feedback.patient_reply_deleted_at = None  # Clear deletion timestamp when re-adding
            else:  # If deleting reply (setting to null)
                feedback.patient_reply_deleted_at = now
                feedback.patient_reply_at = None

        if 'doctor_reply_to_patient' in request.data:
            if request.data.get('doctor_reply_to_patient'):
                feedback.doctor_reply_to_patient_at = now
                feedback.doctor_reply_to_patient_deleted_at = None  # Clear deletion timestamp when re-adding
            else:
                feedback.doctor_reply_to_patient_deleted_at = now
                feedback.doctor_reply_to_patient_at = None

        # Save the feedback with updated timestamps
        feedback.save()

        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='doctor/(?P<doctor_id>[^/.]+)')
    def by_doctor(self, request, doctor_id=None):
        """Get all feedback for a doctor"""
        limit = int(request.query_params.get('limit', 10))
        feedback = Feedback.objects.filter(doctor_id=doctor_id)[:limit]
        serializer = self.get_serializer(feedback, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def by_patient(self, request, patient_id=None):
        """Get all feedback by a patient"""
        feedback = Feedback.objects.filter(patient_id=patient_id)
        serializer = self.get_serializer(feedback, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='messages')
    def create_message(self, request, pk=None):
        """Create a new message in a feedback thread"""
        feedback = self.get_object()
        sender_type = request.data.get('sender_type')
        message_text = request.data.get('message_text')

        if not sender_type or sender_type not in ['patient', 'doctor']:
            return Response(
                {'error': 'sender_type must be either "patient" or "doctor"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not message_text or len(message_text.strip()) < 5:
            return Response(
                {'error': 'Message must be at least 5 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the message
        message = FeedbackMessage.objects.create(
            feedback=feedback,
            sender_type=sender_type,
            message_text=message_text
        )

        serializer = FeedbackMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='messages')
    def get_messages(self, request, pk=None):
        """Get all messages for a feedback thread"""
        feedback = self.get_object()
        messages = feedback.messages.all()
        serializer = FeedbackMessageSerializer(messages, many=True)
        return Response(serializer.data)


@api_view(['PATCH'])
def update_feedback_message(request, message_id):
    """Update a feedback message"""
    try:
        message = FeedbackMessage.objects.get(id=message_id)
    except FeedbackMessage.DoesNotExist:
        return Response(
            {'error': 'Message not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    message_text = request.data.get('message_text')
    if not message_text or len(message_text.strip()) < 5:
        return Response(
            {'error': 'Message must be at least 5 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )

    message.message_text = message_text
    message.updated_at = timezone.now()
    message.save()

    serializer = FeedbackMessageSerializer(message)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_feedback_message(request, message_id):
    """Soft delete a feedback message"""
    try:
        message = FeedbackMessage.objects.get(id=message_id)
    except FeedbackMessage.DoesNotExist:
        return Response(
            {'error': 'Message not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    deleted_by = request.data.get('deleted_by')
    if not deleted_by or deleted_by not in ['patient', 'doctor']:
        return Response(
            {'error': 'deleted_by must be either "patient" or "doctor"'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Soft delete
    message.deleted_at = timezone.now()
    message.deleted_by = deleted_by
    message.save()

    serializer = FeedbackMessageSerializer(message)
    return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=False, methods=['get'])
    def for_user(self, request):
        """Get notifications for a specific user (patient or doctor)"""
        user_type = request.query_params.get('user_type')
        user_id = request.query_params.get('user_id')
        notification_type = request.query_params.get('notification_type')  # optional filter

        if not user_type or not user_id:
            return Response(
                {'error': 'user_type and user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notifications = Notification.objects.filter(
            user_type=user_type,
            user_id=user_id
        )

        # Optional filter by notification type
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type)

        notifications = notifications.order_by('-created_at')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def get_serializer_context(self):
        """Add request to serializer context for URL building"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all conversations for a user (list of unique conversation partners)"""
        user_type = request.query_params.get('user_type')
        user_id = request.query_params.get('user_id')

        if not user_type or not user_id:
            return Response(
                {'error': 'user_type and user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all messages where user is sender or receiver
        messages = Message.objects.filter(
            Q(sender_type=user_type, sender_id=user_id) |
            Q(receiver_type=user_type, receiver_id=user_id)
        ).order_by('-created_at')

        # Get unique conversation partners
        partners = {}
        for msg in messages:
            if msg.sender_type == user_type and msg.sender_id == user_id:
                # User is sender, get receiver info
                partner_key = f"{msg.receiver_type}_{msg.receiver_id}"
                if partner_key not in partners:
                    partners[partner_key] = {
                        'user_type': msg.receiver_type,
                        'user_id': msg.receiver_id,
                        'last_message': msg.text or '[Attachment]',
                        'last_message_time': msg.created_at,
                        'unread_count': 0
                    }
            else:
                # User is receiver, get sender info
                partner_key = f"{msg.sender_type}_{msg.sender_id}"
                if partner_key not in partners:
                    partners[partner_key] = {
                        'user_type': msg.sender_type,
                        'user_id': msg.sender_id,
                        'last_message': msg.text or '[Attachment]',
                        'last_message_time': msg.created_at,
                        'unread_count': 0
                    }
                # Count unread messages
                if not msg.is_read:
                    partners[partner_key]['unread_count'] += 1

        # Get partner details (name, avatar)
        result = []
        for partner_data in partners.values():
            partner_info = {}
            try:
                if partner_data['user_type'] == 'patient':
                    patient = Patient.objects.get(id=partner_data['user_id'])
                    avatar_url = None
                    if patient.avatar:
                        avatar_url = request.build_absolute_uri(patient.avatar.url)
                    partner_info = {
                        'id': patient.id,
                        'name': f"{patient.first_name} {patient.middle_name or ''} {patient.last_name}".replace('  ', ' ').strip(),
                        'avatar': avatar_url,
                        'user_type': 'patient'
                    }
                elif partner_data['user_type'] == 'doctor':
                    doctor = Doctor.objects.get(id=partner_data['user_id'])
                    avatar_url = None
                    if doctor.avatar:
                        avatar_url = request.build_absolute_uri(doctor.avatar.url)
                    partner_info = {
                        'id': doctor.id,
                        'name': f"Dr. {doctor.first_name} {doctor.middle_name or ''} {doctor.last_name}".replace('  ', ' ').strip(),
                        'specialty': doctor.specialty,
                        'avatar': avatar_url,
                        'user_type': 'doctor'
                    }
            except Exception as e:
                print(f"Error getting partner info: {e}")
                continue

            result.append({
                **partner_info,
                'last_message': partner_data['last_message'],
                'last_message_time': partner_data['last_message_time'],
                'unread_count': partner_data['unread_count']
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def with_user(self, request):
        """Get all messages between two users"""
        user_type = request.query_params.get('user_type')
        user_id = request.query_params.get('user_id')
        partner_type = request.query_params.get('partner_type')
        partner_id = request.query_params.get('partner_id')

        if not all([user_type, user_id, partner_type, partner_id]):
            return Response(
                {'error': 'user_type, user_id, partner_type, and partner_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get messages between the two users
        messages = Message.objects.filter(
            Q(sender_type=user_type, sender_id=user_id, receiver_type=partner_type, receiver_id=partner_id) |
            Q(sender_type=partner_type, sender_id=partner_id, receiver_type=user_type, receiver_id=user_id)
        ).order_by('created_at')

        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send a new message"""
        sender_type = request.data.get('sender_type')
        sender_id = request.data.get('sender_id')
        receiver_type = request.data.get('receiver_type')
        receiver_id = request.data.get('receiver_id')
        text = request.data.get('text')
        attachment = request.FILES.get('attachment')

        if not all([sender_type, sender_id, receiver_type, receiver_id]):
            return Response(
                {'error': 'sender_type, sender_id, receiver_type, and receiver_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not text and not attachment:
            return Response(
                {'error': 'Either text or attachment is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create message
        message_data = {
            'sender_type': sender_type,
            'sender_id': sender_id,
            'receiver_type': receiver_type,
            'receiver_id': receiver_id,
            'text': text,
        }

        if attachment:
            message_data['attachment'] = attachment
            message_data['attachment_name'] = attachment.name
            message_data['attachment_type'] = attachment.content_type

        message = Message.objects.create(**message_data)

        # Create notification for receiver
        try:
            # Get sender name
            sender_name = "Someone"
            if sender_type == 'patient':
                try:
                    patient = Patient.objects.get(id=sender_id)
                    sender_name = f"{patient.first_name} {patient.last_name}"
                except:
                    pass
            elif sender_type == 'doctor':
                try:
                    doctor = Doctor.objects.get(id=sender_id)
                    sender_name = f"Dr. {doctor.first_name} {doctor.last_name}"
                except:
                    pass

            # Create notification based on receiver type
            notification_message = text[:100] if text else "Sent you an attachment"

            if receiver_type == 'doctor':
                Notification.objects.create(
                    user_type='doctor',
                    user_id=receiver_id,
                    notification_type='message',
                    title=f'New message from {sender_name}',
                    message=notification_message
                )
            elif receiver_type == 'patient':
                from .models import PatientNotification
                PatientNotification.objects.create(
                    patient_id=receiver_id,
                    category='message',
                    title=f'New message from {sender_name}',
                    message=notification_message
                )
        except Exception as e:
            print(f"Error creating message notification: {e}")

        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_conversation_read(self, request):
        """Mark all messages in a conversation as read"""
        user_type = request.data.get('user_type')
        user_id = request.data.get('user_id')
        partner_type = request.data.get('partner_type')
        partner_id = request.data.get('partner_id')

        if not all([user_type, user_id, partner_type, partner_id]):
            return Response(
                {'error': 'user_type, user_id, partner_type, and partner_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark all unread messages from partner to user as read
        Message.objects.filter(
            sender_type=partner_type,
            sender_id=partner_id,
            receiver_type=user_type,
            receiver_id=user_id,
            is_read=False
        ).update(is_read=True)

        return Response({'status': 'conversation marked as read'})



from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Count
from django.utils import timezone
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import timedelta, date

from .models import AdminUser

# REST Framework imports
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication

# Import your admin models and serializers
from .serializers import (
    AdminUserSerializer,
    AdminLoginSerializer,
    AdminRegisterSerializer,
    AdminProfileUpdateSerializer,
    AdminChangePasswordSerializer,
    RecentAppointmentSerializer,
    DoctorListSerializer,
    DoctorDetailSerializer,
    DoctorCreateUpdateSerializer,
    PatientListSerializer,
    PatientDetailSerializer,
    PatientCreateUpdateSerializer,
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AppointmentStatusUpdateSerializer,
    AppointmentCreateSerializer,
    DoctorSearchSerializer,
    PatientSearchSerializer,
)

from api.models import Doctor, Patient, Appointment


# ========================
# ADMIN AUTHENTICATION VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginAPIView(APIView):
    """Admin login API endpoint - CSRF exempt"""
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required for login
    
    def post(self, request):
        serializer = AdminLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.record_login()
            
            # Create or get token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Login successful',
                'token': token.key,
                'user': AdminUserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@method_decorator(csrf_exempt, name='dispatch')
class AdminLogoutAPIView(APIView):
    """Admin logout API endpoint - CSRF exempt"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        # Delete token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminRegisterAPIView(APIView):
    """Admin registration API endpoint - CSRF exempt"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            admin = serializer.save()
            token, created = Token.objects.get_or_create(user=admin)
            
            return Response({
                'message': 'Admin registered successfully',
                'token': token.key,
                'user': AdminUserSerializer(admin).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ========================
# ADMIN DASHBOARD VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminDashboardAPIView(APIView):
    """Complete admin dashboard data"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        # Get counts
        total_doctors = Doctor.objects.count()
        total_patients = Patient.objects.count()
        total_appointments = Appointment.objects.count()
        
        # Appointments statistics
        today = timezone.now().date()
        today_appointments = Appointment.objects.filter(
            appointment_date=today
        ).count()
        
        upcoming_appointments = Appointment.objects.filter(
            status='upcoming'
        ).count()
        
        completed_appointments = Appointment.objects.filter(
            status='completed'
        ).count()
        
        cancelled_appointments = Appointment.objects.filter(
            status='cancelled'
        ).count()
        
        # Recent appointments
        recent_appointments = Appointment.objects.select_related(
            'doctor', 'patient'
        ).order_by('-created_at')[:10]
        
        # System Alerts
        system_alerts = []
        
        # Get upcoming appointments with dates for alerts
        upcoming_appts = Appointment.objects.filter(
            status='upcoming'
        ).select_related('doctor', 'patient').order_by('appointment_date', 'appointment_time')[:5]
        
        for appt in upcoming_appts:
            # Format appointment time properly
            appt_time_str = appt.appointment_time.strftime('%H:%M') if appt.appointment_time else 'N/A'
            system_alerts.append({
                'type': 'warning',
                'icon': 'fa-calendar-check',
                'title': 'Upcoming Appointment',
                'message': f'Dr. {appt.doctor.first_name} {appt.doctor.last_name} with {appt.patient.first_name} {appt.patient.last_name}',
                'time': f'{appt.appointment_date.strftime("%b %d, %Y")} at {appt_time_str}',
                'link': f'/admin/appointments/{appt.id}/'
            })
        
        # Get today's appointments with dates
        today_appts = Appointment.objects.filter(
            appointment_date=today
        ).select_related('doctor', 'patient').order_by('appointment_time')[:5]
        
        for appt in today_appts:
            # Format appointment time properly
            appt_time_str = appt.appointment_time.strftime('%H:%M') if appt.appointment_time else 'N/A'
            system_alerts.append({
                'type': 'info',
                'icon': 'fa-calendar-day',
                'title': 'Today\'s Appointment',
                'message': f'Dr. {appt.doctor.first_name} {appt.doctor.last_name} with {appt.patient.first_name} {appt.patient.last_name}',
                'time': f'{appt.appointment_date.strftime("%b %d, %Y")} at {appt_time_str}',
                'link': f'/admin/appointments/{appt.id}/'
            })
        
        week_ago = timezone.now() - timedelta(days=7)
        new_patients = Patient.objects.filter(created_at__gte=week_ago).count()
        if new_patients > 0:
            system_alerts.append({
                'type': 'success',
                'icon': 'fa-user-plus',
                'title': 'New Patient Registrations',
                'message': f'{new_patients} new patient(s) registered this week',
                'time': 'This week',
                'link': '/admin/patients/'
            })
        
        last_month = timezone.now() - timedelta(days=30)
        monthly_appointments = Appointment.objects.filter(
            created_at__gte=last_month
        ).count()
        
        return Response({
            'stats': {
                'total_doctors': total_doctors,
                'total_patients': total_patients,
                'total_appointments': total_appointments,
                'today_appointments': today_appointments,
                'upcoming_appointments': upcoming_appointments,
                'completed_appointments': completed_appointments,
                'cancelled_appointments': cancelled_appointments,
                'monthly_appointments': monthly_appointments,
                'new_patients_week': new_patients,
                'alerts_count': len(system_alerts)
            },
            'recent_appointments': RecentAppointmentSerializer(
                recent_appointments, many=True
            ).data,
            'system_alerts': system_alerts
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DashboardStatsAPIView(APIView):
    """Real-time dashboard statistics"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        stats = {
            'total_doctors': Doctor.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_appointments': Appointment.objects.count(),
            'upcoming_appointments': Appointment.objects.filter(status='upcoming').count(),
            'today_appointments': Appointment.objects.filter(
                appointment_date=timezone.now().date()
            ).count(),
        }
        
        return Response(stats, status=status.HTTP_200_OK)


# ========================
# ADMIN DOCTORS MANAGEMENT VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorListAPIView(generics.ListAPIView):
    """List all doctors with search and filter"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = DoctorListSerializer
    
    def get_queryset(self):
        queryset = Doctor.objects.all().order_by('-created_at')
        
        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(specialty__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Filter by specialization
        specialty = self.request.query_params.get('specialty', '')
        if specialty:
            queryset = queryset.filter(specialty=specialty)
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorDetailAPIView(generics.RetrieveAPIView):
    """Get detailed doctor information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = DoctorDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'doctor_id'
    queryset = Doctor.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorCreateAPIView(generics.CreateAPIView):
    """Create a new doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = DoctorCreateUpdateSerializer
    queryset = Doctor.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorUpdateAPIView(generics.UpdateAPIView):
    """Update doctor information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = DoctorCreateUpdateSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'doctor_id'
    queryset = Doctor.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorDeleteAPIView(APIView):
    """Delete a doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def delete(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            
            # Check for upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                doctor=doctor,
                status='upcoming'
            ).count()
            
            if upcoming_appointments > 0:
                return Response({
                    'error': f'Cannot delete doctor. {upcoming_appointments} upcoming appointment(s) found.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            doctor.delete()
            
            return Response({
                'message': 'Doctor deleted successfully.'
            }, status=status.HTTP_200_OK)
        
        except Doctor.DoesNotExist:
            return Response({
                'error': 'Doctor not found'
            }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorStatsAPIView(APIView):
    """Get doctor statistics"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        total_doctors = Doctor.objects.count()
        
        # Doctors by specialty
        doctors_by_specialty = {}
        specialties = Doctor.objects.values('specialty').annotate(
            count=Count('id')
        )
        for item in specialties:
            doctors_by_specialty[item['specialty']] = item['count']
        
        # Average experience
        from django.db.models import Avg
        avg_experience = Doctor.objects.aggregate(
            avg=Avg('years_of_experience')
        )['avg'] or 0
        
        stats = {
            'total_doctors': total_doctors,
            'doctors_by_specialty': doctors_by_specialty,
            'average_experience': round(avg_experience, 2)
        }
        
        return Response(stats, status=status.HTTP_200_OK)


# ========================
# ADMIN PATIENTS MANAGEMENT VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientListAPIView(generics.ListAPIView):
    """List all patients with search and filter"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = PatientListSerializer
    
    def get_queryset(self):
        queryset = Patient.objects.all().order_by('-created_at')
        
        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(id__icontains=search)
            )
        
        # Filter by new registrations
        if self.request.query_params.get('filter') == 'new':
            week_ago = timezone.now() - timedelta(days=7)
            queryset = queryset.filter(created_at__gte=week_ago)
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientDetailAPIView(generics.RetrieveAPIView):
    """Get detailed patient information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = PatientDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'patient_id'
    queryset = Patient.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientCreateAPIView(generics.CreateAPIView):
    """Create a new patient"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = PatientCreateUpdateSerializer
    queryset = Patient.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientUpdateAPIView(generics.UpdateAPIView):
    """Update patient information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = PatientCreateUpdateSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'patient_id'
    queryset = Patient.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientDeleteAPIView(APIView):
    """Delete a patient"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def delete(self, request, patient_id):
        try:
            patient = Patient.objects.get(id=patient_id)
            
            # Check for upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                patient=patient,
                appointment_date__gte=timezone.now().date(),
                status='upcoming'
            ).count()
            
            if upcoming_appointments > 0:
                return Response({
                    'error': f'Cannot delete patient. {upcoming_appointments} upcoming appointment(s) found.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            patient.delete()
            
            return Response({
                'message': 'Patient deleted successfully.'
            }, status=status.HTTP_200_OK)
        
        except Patient.DoesNotExist:
            return Response({
                'error': 'Patient not found'
            }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class AdminPatientStatsAPIView(APIView):
    """Get patient statistics"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        total_patients = Patient.objects.count()
        
        # New patients this month
        month_ago = timezone.now() - timedelta(days=30)
        new_patients_month = Patient.objects.filter(
            created_at__gte=month_ago
        ).count()
        
        # Patients by gender
        patients_by_gender = {}
        genders = Patient.objects.values('gender').annotate(
            count=Count('id')
        )
        for item in genders:
            gender = item['gender'] or 'Not specified'
            patients_by_gender[gender] = item['count']
        
        # Patients by blood type
        patients_by_blood_type = {}
        blood_types = Patient.objects.values('blood_type').annotate(
            count=Count('id')
        )
        for item in blood_types:
            blood_type = item['blood_type'] or 'Not specified'
            patients_by_blood_type[blood_type] = item['count']
        
        stats = {
            'total_patients': total_patients,
            'new_patients_month': new_patients_month,
            'patients_by_gender': patients_by_gender,
            'patients_by_blood_type': patients_by_blood_type
        }
        
        return Response(stats, status=status.HTTP_200_OK)


# ========================
# ADMIN APPOINTMENTS MANAGEMENT VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentListAPIView(generics.ListAPIView):
    """List all appointments with filters"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = AppointmentListSerializer
    
    def get_queryset(self):
        queryset = Appointment.objects.select_related(
            'doctor', 'patient'
        ).order_by('-appointment_date', '-appointment_time')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date
        date_filter = self.request.query_params.get('date', '')
        if date_filter == 'today':
            queryset = queryset.filter(appointment_date=timezone.now().date())
        elif date_filter == 'upcoming':
            queryset = queryset.filter(appointment_date__gte=timezone.now().date())
        
        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(doctor__first_name__icontains=search) |
                Q(doctor__last_name__icontains=search) |
                Q(patient__first_name__icontains=search) |
                Q(patient__last_name__icontains=search) |
                Q(patient__id__icontains=search)
            )
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentDetailAPIView(generics.RetrieveAPIView):
    """Get detailed appointment information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = AppointmentDetailSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'appointment_id'
    queryset = Appointment.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentCreateAPIView(generics.CreateAPIView):
    """Create a new appointment"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = AppointmentCreateSerializer
    queryset = Appointment.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentUpdateStatusAPIView(APIView):
    """Update appointment status"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def patch(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            serializer = AppointmentStatusUpdateSerializer(data=request.data)
            
            if serializer.is_valid():
                appointment.status = serializer.validated_data['status']
                if 'notes' in serializer.validated_data:
                    appointment.notes = serializer.validated_data['notes']
                if 'cancellation_reason' in serializer.validated_data:
                    appointment.cancellation_reason = serializer.validated_data['cancellation_reason']
                if 'cancelled_by' in serializer.validated_data:
                    appointment.cancelled_by = serializer.validated_data['cancelled_by']
                appointment.save()
                
                return Response({
                    'message': 'Appointment status updated successfully',
                    'appointment': AppointmentDetailSerializer(appointment).data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Appointment.DoesNotExist:
            return Response({
                'error': 'Appointment not found'
            }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentDeleteAPIView(APIView):
    """Delete an appointment"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def delete(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            appointment.delete()
            
            return Response({
                'message': 'Appointment deleted successfully.'
            }, status=status.HTTP_200_OK)
        
        except Appointment.DoesNotExist:
            return Response({
                'error': 'Appointment not found'
            }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class AdminAppointmentStatsAPIView(APIView):
    """Get appointment statistics"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        total_appointments = Appointment.objects.count()
        upcoming_appointments = Appointment.objects.filter(status='upcoming').count()
        completed_appointments = Appointment.objects.filter(status='completed').count()
        cancelled_appointments = Appointment.objects.filter(status='cancelled').count()
        today_appointments = Appointment.objects.filter(
            appointment_date=timezone.now().date()
        ).count()
        
        # Appointments by mode
        appointments_by_mode = {}
        modes = Appointment.objects.values('appointment_mode').annotate(
            count=Count('id')
        )
        for item in modes:
            appointments_by_mode[item['appointment_mode']] = item['count']
        
        # Appointments by type
        appointments_by_type = {}
        types = Appointment.objects.values('appointment_type').annotate(
            count=Count('id')
        )
        for item in types:
            appointments_by_type[item['appointment_type']] = item['count']
        
        stats = {
            'total_appointments': total_appointments,
            'upcoming_appointments': upcoming_appointments,
            'completed_appointments': completed_appointments,
            'cancelled_appointments': cancelled_appointments,
            'today_appointments': today_appointments,
            'appointments_by_mode': appointments_by_mode,
            'appointments_by_type': appointments_by_type
        }
        
        return Response(stats, status=status.HTTP_200_OK)


# ========================
# ADMIN SEARCH VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminSearchDoctorsAPIView(APIView):
    """Search doctors"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        doctors = Doctor.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(specialty__icontains=query)
        )[:10]
        
        serializer = DoctorSearchSerializer(doctors, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminSearchPatientsAPIView(APIView):
    """Search patients"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        patients = Patient.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(id__icontains=query)
        )[:10]
        
        serializer = PatientSearchSerializer(patients, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)


# ========================
# ADMIN PROFILE & SETTINGS VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminProfileAPIView(APIView):
    """View and update admin profile"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        serializer = AdminUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        serializer = AdminProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': AdminUserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class AdminChangePasswordAPIView(APIView):
    """Change admin password"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = AdminChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================
# DOCTOR APPROVAL VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class DoctorApprovalListAPIView(APIView):
    """List all doctors pending approval"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        search_query = request.query_params.get('search', '')

        doctors = Doctor.objects.filter(approval_status=status_filter)

        if search_query:
            doctors = doctors.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(specialty__icontains=search_query)
            )

        doctors = doctors.order_by('-created_at')
        serializer = DoctorSerializer(doctors, many=True, context={'request': request})

        return Response({
            'doctors': serializer.data,
            'count': doctors.count()
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DoctorApprovalDetailAPIView(APIView):
    """Get detailed information for doctor approval"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            serializer = DoctorSerializer(doctor, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class DoctorApproveAPIView(APIView):
    """Approve a doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)

            if doctor.approval_status == 'approved':
                return Response(
                    {'error': 'Doctor is already approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update doctor approval status
            doctor.approval_status = 'approved'
            doctor.is_verified = True
            doctor.approved_at = timezone.now()
            doctor.approved_by = request.user
            doctor.rejection_reason = None
            doctor.save()

            # Create notification for doctor
            Notification.objects.create(
                user_type='doctor',
                user_id=doctor.id,
                notification_type='system',
                title='Account Approved!',
                message=f'Congratulations! Your account has been approved by the admin. You are now verified and visible to patients.',
                related_appointment=None
            )

            return Response({
                'message': 'Doctor approved successfully',
                'doctor': DoctorSerializer(doctor, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class DoctorRejectAPIView(APIView):
    """Reject a doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            rejection_reason = request.data.get('reason', 'No reason provided')

            if doctor.approval_status == 'rejected':
                return Response(
                    {'error': 'Doctor is already rejected'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update doctor approval status
            doctor.approval_status = 'rejected'
            doctor.is_verified = False
            doctor.rejection_reason = rejection_reason
            doctor.save()

            # Create notification for doctor
            Notification.objects.create(
                user_type='doctor',
                user_id=doctor.id,
                notification_type='system',
                title='Account Application Rejected',
                message=f'Unfortunately, your account application has been rejected. Reason: {rejection_reason}',
                related_appointment=None
            )

            return Response({
                'message': 'Doctor rejected successfully',
                'doctor': DoctorSerializer(doctor, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class DoctorApprovalStatsAPIView(APIView):
    """Get approval statistics"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        pending_count = Doctor.objects.filter(approval_status='pending').count()
        approved_count = Doctor.objects.filter(approval_status='approved').count()
        rejected_count = Doctor.objects.filter(approval_status='rejected').count()
        total_count = Doctor.objects.count()

        return Response({
            'pending': pending_count,
            'approved': approved_count,
            'rejected': rejected_count,
            'total': total_count
        }, status=status.HTTP_200_OK)


# ========================
# ADMIN DOCTOR APPOINTMENTS VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminDoctorAppointmentsAPIView(APIView):
    """Get all appointments for a specific doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            appointments = Appointment.objects.filter(doctor=doctor).select_related('patient', 'doctor', 'location')
            
            appointments_data = []
            for appointment in appointments:
                appointment_data = {
                    'id': appointment.id,
                    'patient': {
                        'id': appointment.patient.id,
                        'first_name': appointment.patient.first_name,
                        'last_name': appointment.patient.last_name,
                        'email': appointment.patient.email,
                        'phone': appointment.patient.phone,
                    },
                    'doctor': {
                        'id': appointment.doctor.id,
                        'first_name': appointment.doctor.first_name,
                        'last_name': appointment.doctor.last_name,
                        # Doctor model doesn't have a `full_name` field — build it here
                        'full_name': f"{appointment.doctor.first_name}{' ' + appointment.doctor.middle_name if appointment.doctor.middle_name else ''} {appointment.doctor.last_name}".strip(),
                        'specialty': appointment.doctor.specialty,
                    },
                    'appointment_date': appointment.appointment_date,
                    'appointment_time': appointment.appointment_time,
                    'appointment_type': appointment.appointment_type,
                    'appointment_mode': appointment.appointment_mode,
                    'location': {
                        'id': str(appointment.location.id),
                        'name': appointment.location.name,
                        'address': appointment.location.address,
                    } if appointment.location else None,
                    'status': appointment.status,
                    'symptoms': appointment.reason,
                    'cancellation_reason': appointment.cancellation_reason,
                    'cancelled_by': appointment.cancelled_by,
                    'reschedule_reason': appointment.reschedule_reason,
                    'rescheduled_by': appointment.rescheduled_by,
                    'created_at': appointment.created_at,
                }
                appointments_data.append(appointment_data)
            
            return Response(appointments_data, status=status.HTTP_200_OK)
        
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminCancelAppointmentAPIView(APIView):
    """Cancel an appointment as admin"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Check if appointment is upcoming
            if appointment.status != 'upcoming':
                return Response(
                    {'error': 'Only upcoming appointments can be cancelled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cancellation_reason = request.data.get('cancellation_reason', '').strip()
            if not cancellation_reason:
                return Response(
                    {'error': 'Cancellation reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update appointment
            appointment.status = 'cancelled'
            appointment.cancellation_reason = cancellation_reason
            appointment.cancelled_by = 'admin'
            appointment.cancelled_at = timezone.now()
            appointment.save()
            
            return Response({
                'message': 'Appointment cancelled successfully',
                'appointment': {
                    'id': appointment.id,
                    'status': appointment.status,
                    'cancellation_reason': appointment.cancellation_reason,
                    'cancelled_by': appointment.cancelled_by,
                }
            }, status=status.HTTP_200_OK)
        
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminRescheduleAppointmentAPIView(APIView):
    """Reschedule an appointment as admin"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Check if appointment is upcoming
            if appointment.status != 'upcoming':
                return Response(
                    {'error': 'Only upcoming appointments can be rescheduled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            reschedule_reason = request.data.get('reschedule_reason', '').strip()
            new_date = request.data.get('new_date')
            new_time = request.data.get('new_time')
            
            if not reschedule_reason:
                return Response(
                    {'error': 'Reschedule reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not new_date or not new_time:
                return Response(
                    {'error': 'New date and time are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store original date and time if not already stored
            if not appointment.original_date:
                appointment.original_date = appointment.appointment_date
                appointment.original_time = appointment.appointment_time
            
            # Update appointment
            appointment.appointment_date = new_date
            appointment.appointment_time = new_time
            appointment.reschedule_reason = reschedule_reason
            appointment.rescheduled_by = 'admin'
            appointment.rescheduled_at = timezone.now()
            appointment.save()
            
            return Response({
                'message': 'Appointment rescheduled successfully',
                'appointment': {
                    'id': appointment.id,
                    'appointment_date': appointment.appointment_date,
                    'appointment_time': appointment.appointment_time,
                    'reschedule_reason': appointment.reschedule_reason,
                    'rescheduled_by': appointment.rescheduled_by,
                    'original_date': appointment.original_date,
                    'original_time': appointment.original_time,
                }
            }, status=status.HTTP_200_OK)
        
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ========================
# ADMIN DOCTOR BLOCKING VIEWS
# ========================

@method_decorator(csrf_exempt, name='dispatch')
class AdminBlockDoctorAPIView(APIView):
    """Block a doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            
            # Check if already blocked
            if doctor.is_blocked:
                return Response(
                    {'error': 'Doctor is already blocked'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            block_reason = request.data.get('block_reason', '').strip()
            if not block_reason:
                return Response(
                    {'error': 'Block reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get admin user
            admin_email = request.user.email
            admin_user = AdminUser.objects.filter(email=admin_email).first()
            
            # Block the doctor
            doctor.is_blocked = True
            doctor.block_reason = block_reason
            doctor.blocked_at = timezone.now()
            doctor.blocked_by = admin_user
            doctor.save()
            
            # Create audit log entry
            DoctorBlockingAuditLog.objects.create(
                doctor=doctor,
                action='blocked',
                reason=block_reason,
                performed_by=admin_user,
                doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}",
                doctor_email=doctor.email,
                doctor_specialty=doctor.specialty or 'N/A',
                admin_name=admin_user.full_name if admin_user else 'Unknown Admin',
                admin_email=admin_user.email if admin_user else admin_email
            )
            
            # Create notification for doctor
            Notification.objects.create(
                user_type='doctor',
                user_id=doctor.id,
                notification_type='system',
                title='Account Blocked',
                message=f'Your account has been blocked by the administrator. Reason: {block_reason}',
                is_read=False
            )
            
            # Notify all patients with upcoming appointments with this doctor
            upcoming_appointments = Appointment.objects.filter(
                doctor=doctor,
                status='upcoming'
            ).select_related('patient')
            
            for appointment in upcoming_appointments:
                Notification.objects.create(
                    user_type='patient',
                    user_id=appointment.patient.id,
                    notification_type='system',
                    title='Doctor Blocked',
                    message=f'Dr. {doctor.first_name} {doctor.last_name} has been temporarily blocked by the administrator. Your upcoming appointment on {appointment.appointment_date} may be affected.',
                    is_read=False,
                    related_appointment=appointment
                )
            
            return Response({
                'message': 'Doctor blocked successfully',
                'doctor': {
                    'id': doctor.id,
                    'is_blocked': doctor.is_blocked,
                    'block_reason': doctor.block_reason,
                    'blocked_at': doctor.blocked_at,
                }
            }, status=status.HTTP_200_OK)
        
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUnblockDoctorAPIView(APIView):
    """Unblock a doctor"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            
            # Check if blocked
            if not doctor.is_blocked:
                return Response(
                    {'error': 'Doctor is not blocked'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get admin user
            admin_email = request.user.email
            admin_user = AdminUser.objects.filter(email=admin_email).first()
            
            # Unblock the doctor
            doctor.is_blocked = False
            # Keep block_reason for history but clear blocked_by and blocked_at
            doctor.save()
            
            # Create audit log entry
            DoctorBlockingAuditLog.objects.create(
                doctor=doctor,
                action='unblocked',
                reason=None,  # No reason needed for unblocking
                performed_by=admin_user,
                doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}",
                doctor_email=doctor.email,
                doctor_specialty=doctor.specialty or 'N/A',
                admin_name=admin_user.full_name if admin_user else 'Unknown Admin',
                admin_email=admin_user.email if admin_user else admin_email
            )
            
            # Create notification for doctor
            Notification.objects.create(
                user_type='doctor',
                user_id=doctor.id,
                notification_type='system',
                title='Account Unblocked',
                message='Your account has been unblocked by the administrator. You can now resume normal operations.',
                is_read=False
            )
            
            # Notify all patients with upcoming appointments with this doctor
            upcoming_appointments = Appointment.objects.filter(
                doctor=doctor,
                status='upcoming'
            ).select_related('patient')
            
            for appointment in upcoming_appointments:
                Notification.objects.create(
                    user_type='patient',
                    user_id=appointment.patient.id,
                    notification_type='booking',
                    title='Doctor Unblocked',
                    message=f'Dr. {doctor.first_name} {doctor.last_name} has been unblocked. Your upcoming appointment on {appointment.appointment_date} is now confirmed.',
                    is_read=False,
                    related_appointment=appointment
                )
            
            return Response({
                'message': 'Doctor unblocked successfully',
                'doctor': {
                    'id': doctor.id,
                    'is_blocked': doctor.is_blocked,
                }
            }, status=status.HTTP_200_OK)
        
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class DoctorBlockingAuditLogAPIView(APIView):
    """Get audit log of all doctor blocking/unblocking actions"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        try:
            # Fetch all audit log entries, ordered by most recent first
            audit_logs = DoctorBlockingAuditLog.objects.all().order_by('-performed_at')
            
            # Serialize the data
            audit_data = []
            for log in audit_logs:
                audit_data.append({
                    'id': str(log.id),
                    'doctor_id': log.doctor.id,
                    'doctor_name': log.doctor_name,
                    'doctor_email': log.doctor_email,
                    'doctor_specialty': log.doctor_specialty,
                    'action': log.action,
                    'reason': log.reason,
                    'performed_by': str(log.performed_by.id) if log.performed_by else None,
                    'performed_by_name': log.admin_name,
                    'performed_by_email': log.admin_email,
                    'performed_at': log.performed_at.isoformat(),
                })
            
            return Response(audit_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Specialty Management Views
@method_decorator(csrf_exempt, name='dispatch')
class SpecialtyListAPIView(APIView):
    """Get list of all approved specialties for dropdown"""
    def get(self, request):
        from api.models import Specialty
        from api.constants import CORE_SPECIALTIES
        
        # Get core specialties (hardcoded)
        core_specialties = list(CORE_SPECIALTIES)
        
        # Get custom approved specialties from database (those added via "Other" option)
        custom_specialties = Specialty.objects.filter(
            approval_status='approved',
            is_predefined=False
        ).order_by('name').values_list('name', flat=True)
        
        # Combine both lists and sort
        all_specialties = sorted(set(core_specialties + list(custom_specialties)))
        
        return Response({
            'specialties': all_specialties
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class PendingSpecialtyListAPIView(APIView):
    """Get list of pending specialty requests (admin only)"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        from api.models import Specialty
        
        pending_specialties = Specialty.objects.filter(
            approval_status='pending'
        ).select_related('requested_by').order_by('-created_at')
        
        specialty_data = []
        for specialty in pending_specialties:
            specialty_data.append({
                'id': str(specialty.id),
                'name': specialty.name,
                'requested_by': {
                    'id': specialty.requested_by.id if specialty.requested_by else None,
                    'first_name': specialty.requested_by.first_name if specialty.requested_by else 'Unknown',
                    'last_name': specialty.requested_by.last_name if specialty.requested_by else '',
                    'email': specialty.requested_by.email if specialty.requested_by else None,
                } if specialty.requested_by else None,
                'created_at': specialty.created_at.isoformat(),
            })
        
        return Response({'specialties': specialty_data}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ApproveSpecialtyAPIView(APIView):
    """Approve a specialty request (admin only)"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, specialty_id):
        from api.models import Specialty
        from django.utils import timezone
        
        try:
            specialty = Specialty.objects.get(id=specialty_id)
            
            if specialty.approval_status != 'pending':
                return Response(
                    {'error': 'Specialty is not pending approval'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get admin user
            admin_email = request.user.email
            admin_user = AdminUser.objects.filter(email=admin_email).first()
            
            # Approve the specialty
            specialty.approval_status = 'approved'
            specialty.approved_by = admin_user
            specialty.approved_at = timezone.now()
            specialty.save()
            
            # Update all doctors with pending_specialty matching this specialty
            doctors_updated = Doctor.objects.filter(
                pending_specialty=specialty.name
            ).update(
                specialty=specialty.name,
                pending_specialty=None
            )
            
            # Notify doctors whose specialty was approved
            for doctor in Doctor.objects.filter(specialty=specialty.name):
                Notification.objects.create(
                    user_type='doctor',
                    user_id=doctor.id,
                    notification_type='system',
                    title='Specialty Approved',
                    message=f'Your requested specialty "{specialty.name}" has been approved by the administrator.',
                    is_read=False
                )
            
            return Response({
                'message': 'Specialty approved successfully',
                'specialty': {
                    'id': str(specialty.id),
                    'name': specialty.name,
                    'approval_status': specialty.approval_status,
                    'doctors_updated': doctors_updated,
                }
            }, status=status.HTTP_200_OK)
            
        except Specialty.DoesNotExist:
            return Response(
                {'error': 'Specialty not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class RejectSpecialtyAPIView(APIView):
    """Reject a specialty request (admin only)"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, specialty_id):
        from api.models import Specialty
        
        try:
            specialty = Specialty.objects.get(id=specialty_id)
            
            if specialty.approval_status != 'pending':
                return Response(
                    {'error': 'Specialty is not pending approval'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            rejection_reason = request.data.get('reason', '')
            
            # Reject the specialty
            specialty.approval_status = 'rejected'
            specialty.rejection_reason = rejection_reason
            specialty.save()
            
            # Notify doctors who requested this specialty
            if specialty.requested_by:
                Notification.objects.create(
                    user_type='doctor',
                    user_id=specialty.requested_by.id,
                    notification_type='system',
                    title='Specialty Request Rejected',
                    message=f'Your requested specialty "{specialty.name}" has been rejected. Reason: {rejection_reason or "No reason provided"}',
                    is_read=False
                )
            
            return Response({
                'message': 'Specialty rejected successfully',
                'specialty': {
                    'id': str(specialty.id),
                    'name': specialty.name,
                    'approval_status': specialty.approval_status,
                }
            }, status=status.HTTP_200_OK)
            
        except Specialty.DoesNotExist:
            return Response(
                {'error': 'Specialty not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# Patient Favorite Doctors Views


# Patient Favorite Doctors Views
@method_decorator(csrf_exempt, name='dispatch')
class PatientFavoritesListAPIView(APIView):
    """Get list of patient's favorite doctors"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, patient_id):
        from api.models import FavoriteDoctor
        
        try:
            # Verify the requesting user is the patient
            patient = Patient.objects.get(id=patient_id)
            
            # Check if the authenticated user corresponds to this patient
            # The user email will be "patient_{patient_id}@system.local"
            expected_email = f"patient_{patient.id}@system.local"
            if request.user.email != expected_email:
                return Response(
                    {'error': 'Unauthorized'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            favorites = FavoriteDoctor.objects.filter(
                patient_id=patient_id
            ).select_related('doctor').order_by('-created_at')
            
            favorites_data = []
            for fav in favorites:
                doctor = fav.doctor
                favorites_data.append({
                    'id': str(fav.id),
                    'doctor_id': doctor.id,
                    'doctor': {
                        'id': doctor.id,
                        'first_name': doctor.first_name,
                        'middle_name': doctor.middle_name,
                        'last_name': doctor.last_name,
                        'specialty': doctor.specialty,
                        'years_of_experience': doctor.years_of_experience,
                        'avatar': doctor.avatar.url if doctor.avatar else None,
                    },
                    'created_at': fav.created_at.isoformat(),
                })
            
            return Response({'favorites': favorites_data}, status=status.HTTP_200_OK)
            
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class AddFavoriteDoctorAPIView(APIView):
    """Add a doctor to patient's favorites"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, patient_id, doctor_id):
        from api.models import FavoriteDoctor
        
        try:
            # Verify the requesting user is the patient
            patient = Patient.objects.get(id=patient_id)
            
            # Check if the authenticated user corresponds to this patient
            # The user email will be "patient_{patient_id}@system.local"
            expected_email = f"patient_{patient.id}@system.local"
            if request.user.email != expected_email:
                return Response(
                    {'error': 'Unauthorized'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verify doctor exists and is approved
            doctor = Doctor.objects.get(id=doctor_id)
            if doctor.approval_status != 'approved':
                return Response(
                    {'error': 'Doctor is not approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or get the favorite
            favorite, created = FavoriteDoctor.objects.get_or_create(
                patient=patient,
                doctor=doctor
            )
            
            if created:
                return Response({
                    'message': 'Doctor added to favorites',
                    'favorite_id': str(favorite.id)
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Doctor already in favorites',
                    'favorite_id': str(favorite.id)
                }, status=status.HTTP_200_OK)
                
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class RemoveFavoriteDoctorAPIView(APIView):
    """Remove a doctor from patient's favorites"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, patient_id, doctor_id):
        from api.models import FavoriteDoctor
        
        try:
            # Verify the requesting user is the patient
            patient = Patient.objects.get(id=patient_id)
            
            # Check if the authenticated user corresponds to this patient
            # The user email will be "patient_{patient_id}@system.local"
            expected_email = f"patient_{patient.id}@system.local"
            if request.user.email != expected_email:
                return Response(
                    {'error': 'Unauthorized'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Remove the favorite
            deleted_count, _ = FavoriteDoctor.objects.filter(
                patient=patient,
                doctor_id=doctor_id
            ).delete()
            
            if deleted_count > 0:
                return Response({
                    'message': 'Doctor removed from favorites'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'Doctor was not in favorites'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ========================
# PAYMENT VIEWS
# ========================

class DoctorPricingViewSet(viewsets.ModelViewSet):
    """ViewSet for doctor pricing"""
    serializer_class = DoctorPricingSerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            return DoctorPricing.objects.filter(doctor_id=doctor_id)
        return DoctorPricing.objects.all()
    
    def perform_create(self, serializer):
        # Check if doctor has at least one bank account
        doctor = serializer.validated_data['doctor']
        doctor_id = doctor.id if hasattr(doctor, 'id') else doctor
        bank_count = DoctorBankAccount.objects.filter(doctor_id=doctor_id).count()
        if bank_count == 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('You must add at least one bank account before setting pricing.')
        
        # Check if pricing already exists for this doctor (OneToOne relationship)
        existing = DoctorPricing.objects.filter(doctor_id=doctor_id).first()
        if existing:
            raise ValidationError('Pricing already exists for this doctor. Use PATCH to update.')
        
        serializer.save()
    
    def perform_update(self, serializer):
        # Check if doctor has at least one bank account
        doctor_id = serializer.instance.doctor.id
        bank_count = DoctorBankAccount.objects.filter(doctor_id=doctor_id).count()
        if bank_count == 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('You must add at least one bank account before updating pricing.')
        serializer.save()


class DoctorBankAccountViewSet(viewsets.ModelViewSet):
    """ViewSet for doctor bank accounts"""
    serializer_class = DoctorBankAccountSerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            return DoctorBankAccount.objects.filter(doctor_id=doctor_id)
        return DoctorBankAccount.objects.all()
    
    def perform_create(self, serializer):
        # If is_default is explicitly True, set others to non-default
        doctor_id = serializer.validated_data['doctor'].id
        if serializer.validated_data.get('is_default', False):
            DoctorBankAccount.objects.filter(doctor_id=doctor_id).update(is_default=False)
        serializer.save()


class PatientPaymentMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for patient payment methods"""
    serializer_class = PatientPaymentMethodSerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return PatientPaymentMethod.objects.filter(patient_id=patient_id)
        return PatientPaymentMethod.objects.all()
    
    def perform_create(self, serializer):
        # Check if patient already has 5 payment methods
        patient = serializer.validated_data['patient']
        patient_id = patient.id if hasattr(patient, 'id') else patient
        method_count = PatientPaymentMethod.objects.filter(patient_id=patient_id).count()
        if method_count >= 5:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Maximum limit reached. You can add up to 5 payment methods only.')
        
        # If is_default is explicitly True, set others to non-default
        if serializer.validated_data.get('is_default', False):
            PatientPaymentMethod.objects.filter(patient_id=patient_id).update(is_default=False)
        serializer.save()


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for transactions"""
    serializer_class = TransactionSerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        
        queryset = Transaction.objects.all()
        
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        return queryset.order_by('-created_at')


class PaymentRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for payment requests"""
    serializer_class = PaymentRequestSerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        status = self.request.query_params.get('status')
        
        queryset = PaymentRequest.objects.all()
        
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Override create to handle errors better"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(f"[PaymentRequest Create Error] {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': str(e), 'detail': 'Failed to create payment request'},
                status=status.HTTP_400_BAD_REQUEST
            )

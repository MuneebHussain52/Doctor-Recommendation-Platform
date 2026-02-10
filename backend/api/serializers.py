from rest_framework import serializers
from .models import Doctor, Patient, Appointment, Feedback, FeedbackMessage, MedicalDocument, Symptom, Notification, HospitalLocation, AppointmentSlot, Message, DoctorPricing, DoctorBankAccount, PatientPaymentMethod, Transaction, PaymentRequest
import base64
import uuid
from django.core.files.base import ContentFile


class DoctorSerializer(serializers.ModelSerializer):
    # Add SerializerMethodFields for document URLs
    national_id_url = serializers.SerializerMethodField()
    medical_degree_url = serializers.SerializerMethodField()
    medical_license_url = serializers.SerializerMethodField()
    specialist_certificates_url = serializers.SerializerMethodField()
    proof_of_practice_url = serializers.SerializerMethodField()

    # Add ranking and rating fields
    avg_rating = serializers.SerializerMethodField()
    total_feedback = serializers.SerializerMethodField()
    ranking_score = serializers.SerializerMethodField()
    
    # Add bank account check
    has_bank_account = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}
    
    def get_has_bank_account(self, obj):
        """Check if doctor has at least one bank account"""
        from .models import DoctorBankAccount
        return DoctorBankAccount.objects.filter(doctor=obj).exists()

    def get_national_id_url(self, obj):
        if obj.national_id:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.national_id.url) if request else obj.national_id.url
        return None

    def get_medical_degree_url(self, obj):
        if obj.medical_degree:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.medical_degree.url) if request else obj.medical_degree.url
        return None

    def get_medical_license_url(self, obj):
        if obj.medical_license:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.medical_license.url) if request else obj.medical_license.url
        return None

    def get_specialist_certificates_url(self, obj):
        if obj.specialist_certificates:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.specialist_certificates.url) if request else obj.specialist_certificates.url
        return None

    def get_proof_of_practice_url(self, obj):
        if obj.proof_of_practice:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.proof_of_practice.url) if request else obj.proof_of_practice.url
        return None

    def to_representation(self, instance):
        # Get the default representation
        representation = super().to_representation(instance)

        # Build absolute URLs for file fields
        request = self.context.get('request')
        if request:
            # Handle avatar
            if instance.avatar:
                representation['avatar'] = request.build_absolute_uri(instance.avatar.url)

            # Handle document fields - use the relative paths as stored in DB
            if instance.national_id:
                representation['national_id'] = request.build_absolute_uri(instance.national_id.url)

            if instance.medical_degree:
                representation['medical_degree'] = request.build_absolute_uri(instance.medical_degree.url)

            if instance.medical_license:
                representation['medical_license'] = request.build_absolute_uri(instance.medical_license.url)

            if instance.specialist_certificates:
                representation['specialist_certificates'] = request.build_absolute_uri(instance.specialist_certificates.url)

            if instance.proof_of_practice:
                representation['proof_of_practice'] = request.build_absolute_uri(instance.proof_of_practice.url)

        # Include pricing details if a DoctorPricing record exists
        try:
            from .models import DoctorPricing
            pricing = DoctorPricing.objects.filter(doctor=instance).first()
            if pricing:
                representation['online_consultation_fee'] = float(pricing.online_fee)
                representation['in_person_consultation_fee'] = float(pricing.in_person_fee)
            else:
                representation['online_consultation_fee'] = None
                representation['in_person_consultation_fee'] = None
        except Exception as e:
            print(f"[DoctorSerializer] Error fetching pricing: {e}")
            representation['online_consultation_fee'] = None
            representation['in_person_consultation_fee'] = None

        return representation

    def to_internal_value(self, data):
        # Handle base64 avatar before validation
        if 'avatar' in data:
            avatar_data = data.get('avatar')

            if isinstance(avatar_data, str):
                if avatar_data == '' or avatar_data is None:
                    # Empty string or None means remove avatar
                    data = data.copy() if hasattr(data, 'copy') else dict(data)
                    data['avatar'] = None
                elif avatar_data.startswith('data:image'):
                    # Extract format and base64 data
                    try:
                        format, imgstr = avatar_data.split(';base64,')
                        ext = format.split('/')[-1]

                        # Decode base64 string
                        decoded_file = ContentFile(base64.b64decode(imgstr), name=f'doctor_avatar_{uuid.uuid4()}.{ext}')

                        # Replace the base64 string with the file object
                        data = data.copy() if hasattr(data, 'copy') else dict(data)
                        data['avatar'] = decoded_file
                    except Exception as e:
                        print(f"[DoctorSerializer] Error decoding base64 avatar: {e}")

        return super().to_internal_value(data)

    def get_avg_rating(self, obj):
        """Calculate average rating from feedback"""
        from django.db.models import Avg
        result = Feedback.objects.filter(doctor=obj).aggregate(avg_rating=Avg('rating'))
        return round(result['avg_rating'], 2) if result['avg_rating'] else None

    def get_total_feedback(self, obj):
        """Get total count of feedback/reviews"""
        return Feedback.objects.filter(doctor=obj).count()

    def get_ranking_score(self, obj):
        """Calculate composite ranking score using DoctorRankingService"""
        from api.ranking_service import DoctorRankingService

        # Get predicted specialty from context if available
        predicted_specialty = self.context.get('predicted_specialty')

        # Calculate ranking score
        score = DoctorRankingService.calculate_score(
            doctor=obj,
            predicted_specialty=predicted_specialty
        )

        return score


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def to_internal_value(self, data):
        # Handle base64 avatar before validation
        if 'avatar' in data:
            avatar_data = data.get('avatar')

            if isinstance(avatar_data, str):
                if avatar_data == '' or avatar_data is None:
                    # Empty string or None means remove avatar
                    data = data.copy() if hasattr(data, 'copy') else dict(data)
                    data['avatar'] = None
                elif avatar_data.startswith('data:image'):
                    # Extract format and base64 data
                    try:
                        format, imgstr = avatar_data.split(';base64,')
                        ext = format.split('/')[-1]

                        # Decode base64 string
                        decoded_file = ContentFile(base64.b64decode(imgstr), name=f'patient_avatar_{uuid.uuid4()}.{ext}')

                        # Replace the base64 string with the file object
                        data = data.copy() if hasattr(data, 'copy') else dict(data)
                        data['avatar'] = decoded_file
                    except Exception as e:
                        print(f"[PatientSerializer] Error decoding base64 avatar: {e}")

        return super().to_internal_value(data)


class HospitalLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalLocation
        fields = '__all__'


class AppointmentSlotSerializer(serializers.ModelSerializer):
    location_info = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = '__all__'

    def get_location_info(self, obj):
        if obj.location:
            return {
                'id': str(obj.location.id),
                'name': obj.location.name,
                'address': obj.location.address,
                'phone': obj.location.phone
            }
        return None


class AppointmentSerializer(serializers.ModelSerializer):
    patient_info = serializers.SerializerMethodField()
    doctor_info = serializers.SerializerMethodField()
    feedback_given = serializers.SerializerMethodField()
    location_info = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = '__all__'
    
    def create(self, validated_data):
        """Generate appointment ID if not provided"""
        import time
        import random
        
        if 'id' not in validated_data or not validated_data.get('id'):
            # Generate appointment ID: APT-{timestamp}-{random}
            timestamp = int(time.time())
            random_suffix = random.randint(1000, 9999)
            validated_data['id'] = f"APT-{timestamp}-{random_suffix}"
        
        return super().create(validated_data)

    def get_location_info(self, obj):
        if obj.location:
            return {
                'id': str(obj.location.id),
                'name': obj.location.name,
                'address': obj.location.address,
                'phone': obj.location.phone
            }
        return None

    def get_patient_info(self, obj):
        from datetime import date
        age = 0
        if obj.patient.date_of_birth:
            today = date.today()
            dob = obj.patient.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Get request to build absolute URL for avatar
        request = self.context.get('request')
        avatar_url = None
        if obj.patient.avatar:
            avatar_url = request.build_absolute_uri(obj.patient.avatar.url) if request else obj.patient.avatar.url

        return {
            'name': f"{obj.patient.first_name} {obj.patient.middle_name or ''} {obj.patient.last_name}".replace('  ', ' '),
            'avatar': avatar_url,
            'phone': obj.patient.phone,
            'email': obj.patient.email,
            'gender': obj.patient.gender,
            'age': age,
        }

    def get_doctor_info(self, obj):
        # Get request to build absolute URL for avatar
        request = self.context.get('request')
        avatar_url = None
        if obj.doctor.avatar:
            avatar_url = request.build_absolute_uri(obj.doctor.avatar.url) if request else obj.doctor.avatar.url

        return {
            'id': obj.doctor.id,
            'name': f"Dr. {obj.doctor.first_name} {obj.doctor.middle_name or ''} {obj.doctor.last_name}".replace('  ', ' '),
            'specialty': obj.doctor.specialty,
            'avatar': avatar_url,
            'phone': obj.doctor.phone,
            'email': obj.doctor.email,
        }

    def get_feedback_given(self, obj):
        return obj.feedback.exists()


class FeedbackSerializer(serializers.ModelSerializer):
    patient_info = serializers.SerializerMethodField(read_only=True)
    doctor_info = serializers.SerializerMethodField(read_only=True)
    messages = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Feedback
        fields = '__all__'

    def get_messages(self, obj):
        messages = obj.messages.all()
        return FeedbackMessageSerializer(messages, many=True).data

    def get_patient_info(self, obj):
        try:
            request = self.context.get('request')
            avatar_url = None
            if obj.patient.avatar:
                try:
                    avatar_url = request.build_absolute_uri(obj.patient.avatar.url) if request else str(obj.patient.avatar.url)
                except Exception as e:
                    print(f"Error building avatar URL: {e}")
                    avatar_url = None

            first_name = str(obj.patient.first_name or '')
            middle_name = str(obj.patient.middle_name or '')
            last_name = str(obj.patient.last_name or '')
            full_name = f"{first_name} {middle_name} {last_name}".replace('  ', ' ').strip()

            return {
                'name': full_name,
                'avatar': avatar_url,
            }
        except Exception as e:
            print(f"Error in get_patient_info: {e}")
            return {
                'name': 'Unknown Patient',
                'avatar': None,
            }

    def get_doctor_info(self, obj):
        try:
            first_name = str(obj.doctor.first_name or '')
            middle_name = str(obj.doctor.middle_name or '')
            last_name = str(obj.doctor.last_name or '')
            full_name = f"Dr. {first_name} {middle_name} {last_name}".replace('  ', ' ').strip()
            specialty = str(obj.doctor.specialty or '')

            return {
                'name': full_name,
                'specialty': specialty,
            }
        except Exception as e:
            print(f"Error in get_doctor_info: {e}")
            return {
                'name': 'Unknown Doctor',
                'specialty': '',
            }


class FeedbackMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackMessage
        fields = '__all__'


class MedicalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalDocument
        fields = '__all__'


class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()
    sender_info = serializers.SerializerMethodField()
    receiver_info = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url
        return None

    def get_sender_info(self, obj):
        try:
            if obj.sender_type == 'patient':
                patient = Patient.objects.get(id=obj.sender_id)
                request = self.context.get('request')
                avatar_url = None
                if patient.avatar:
                    avatar_url = request.build_absolute_uri(patient.avatar.url) if request else patient.avatar.url
                return {
                    'id': patient.id,
                    'name': f"{patient.first_name} {patient.middle_name or ''} {patient.last_name}".replace('  ', ' ').strip(),
                    'avatar': avatar_url
                }
            elif obj.sender_type == 'doctor':
                doctor = Doctor.objects.get(id=obj.sender_id)
                request = self.context.get('request')
                avatar_url = None
                if doctor.avatar:
                    avatar_url = request.build_absolute_uri(doctor.avatar.url) if request else doctor.avatar.url
                return {
                    'id': doctor.id,
                    'name': f"Dr. {doctor.first_name} {doctor.middle_name or ''} {doctor.last_name}".replace('  ', ' ').strip(),
                    'specialty': doctor.specialty,
                    'avatar': avatar_url
                }
        except Exception as e:
            print(f"Error getting sender info: {e}")
        return None

    def get_receiver_info(self, obj):
        try:
            if obj.receiver_type == 'patient':
                patient = Patient.objects.get(id=obj.receiver_id)
                return {
                    'id': patient.id,
                    'name': f"{patient.first_name} {patient.middle_name or ''} {patient.last_name}".replace('  ', ' ').strip()
                }
            elif obj.receiver_type == 'doctor':
                doctor = Doctor.objects.get(id=obj.receiver_id)
                return {
                    'id': doctor.id,
                    'name': f"Dr. {doctor.first_name} {doctor.middle_name or ''} {doctor.last_name}".replace('  ', ' ').strip(),
                    'specialty': doctor.specialty
                }
        except Exception as e:
            print(f"Error getting receiver info: {e}")
        return None
    





    from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import date
from .models import AdminUser
from api.models import Doctor, Patient, Appointment


# ========================
# ADMIN USER SERIALIZERS
# ========================

class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for Admin User model"""
    
    full_name = serializers.CharField(required=True)
    
    class Meta:
        model = AdminUser
        fields = [
            'id',
            'email',
            'full_name',
            'phone_number',
            'profile_picture',
            'department',
            'role',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
            'last_updated',
            'total_logins',
            'notes'
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'last_login',
            'last_updated',
            'total_logins',
            'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'notes': {'required': False}
        }


class AdminLoginSerializer(serializers.Serializer):
    """Serializer for admin login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    'Invalid email or password.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Your account has been deactivated.',
                    code='authorization'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".',
                code='authorization'
            )


class AdminRegisterSerializer(serializers.ModelSerializer):
    """Serializer for admin registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = AdminUser
        fields = [
            'email',
            'full_name',
            'phone_number',
            'password',
            'password_confirm',
            'department',
            'profile_picture'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        admin = AdminUser.objects.create_user(
            password=password,
            **validated_data
        )
        return admin


class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating admin profile"""
    
    class Meta:
        model = AdminUser
        fields = [
            'full_name',
            'phone_number',
            'profile_picture',
            'department',
            'notes'
        ]


class AdminChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing admin password"""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        min_length=8
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })
        return attrs
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


# ========================
# DASHBOARD SERIALIZERS
# ========================

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    
    total_doctors = serializers.IntegerField()
    total_patients = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    monthly_appointments = serializers.IntegerField()
    new_patients_week = serializers.IntegerField()
    alerts_count = serializers.IntegerField()


class SystemAlertSerializer(serializers.Serializer):
    """Serializer for system alerts"""
    
    type = serializers.CharField()
    icon = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    time = serializers.CharField()
    link = serializers.CharField()


class RecentAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for recent appointments in dashboard"""
    
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'doctor_name',
            'patient_name',
            'doctor_specialty',
            'appointment_date',
            'appointment_time',
            'appointment_type',
            'appointment_mode',
            'status',
            'created_at'
        ]
    
    def get_doctor_name(self, obj):
        return f"{obj.doctor.first_name} {obj.doctor.last_name}"
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"


# ========================
# DOCTOR MANAGEMENT SERIALIZERS
# ========================

class DoctorListSerializer(serializers.ModelSerializer):
    """Serializer for doctor list view"""
    
    full_name = serializers.SerializerMethodField()
    total_appointments = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = [
            'id',
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'specialty',
            'phone',
            'avatar',
            'license_number',
            'years_of_experience',
            'appointment_interval',
            'is_blocked',
            'block_reason',
            'blocked_at',
            'created_at',
            'updated_at',
            'total_appointments'
        ]
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"
    
    def get_total_appointments(self, obj):
        return Appointment.objects.filter(doctor=obj).count()


class DoctorDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed doctor view"""
    
    full_name = serializers.SerializerMethodField()
    total_appointments = serializers.SerializerMethodField()
    completed_appointments = serializers.SerializerMethodField()
    upcoming_appointments = serializers.SerializerMethodField()
    cancelled_appointments = serializers.SerializerMethodField()
    recent_appointments = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = [
            'id',
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'date_of_birth',
            'gender',
            'specialty',
            'phone',
            'avatar',
            'license_number',
            'years_of_experience',
            'bio',
            'appointment_interval',
            'time_format',
            'date_format',
            'month_format',
            # Document fields
            'national_id',
            'medical_degree',
            'medical_license',
            'specialist_certificates',
            'proof_of_practice',
            # Approval status fields
            'approval_status',
            'is_verified',
            'approved_at',
            'rejection_reason',
            # Blocking status fields
            'is_blocked',
            'block_reason',
            'blocked_at',
            'created_at',
            'updated_at',
            'total_appointments',
            'completed_appointments',
            'upcoming_appointments',
            'cancelled_appointments',
            'recent_appointments'
        ]
    
    def to_representation(self, instance):
        # Get the default representation
        representation = super().to_representation(instance)

        # Build absolute URLs for file fields
        request = self.context.get('request')
        if request:
            # Handle avatar
            if instance.avatar:
                representation['avatar'] = request.build_absolute_uri(instance.avatar.url)

            # Handle document fields
            if instance.national_id:
                representation['national_id'] = request.build_absolute_uri(instance.national_id.url)

            if instance.medical_degree:
                representation['medical_degree'] = request.build_absolute_uri(instance.medical_degree.url)

            if instance.medical_license:
                representation['medical_license'] = request.build_absolute_uri(instance.medical_license.url)

            if instance.specialist_certificates:
                representation['specialist_certificates'] = request.build_absolute_uri(instance.specialist_certificates.url)

            if instance.proof_of_practice:
                representation['proof_of_practice'] = request.build_absolute_uri(instance.proof_of_practice.url)

        return representation
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"
    
    def get_total_appointments(self, obj):
        return Appointment.objects.filter(doctor=obj).count()
    
    def get_completed_appointments(self, obj):
        return Appointment.objects.filter(
            doctor=obj,
            status='completed'
        ).count()
    
    def get_upcoming_appointments(self, obj):
        return Appointment.objects.filter(
            doctor=obj,
            status='upcoming'
        ).count()
    
    def get_cancelled_appointments(self, obj):
        return Appointment.objects.filter(
            doctor=obj,
            status='cancelled'
        ).count()
    
    def get_recent_appointments(self, obj):
        appointments = Appointment.objects.filter(
            doctor=obj
        ).select_related('patient').order_by('-appointment_date', '-appointment_time')[:5]
        return RecentAppointmentSerializer(appointments, many=True).data


class DoctorCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating doctors"""
    
    class Meta:
        model = Doctor
        fields = [
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'specialty',
            'phone',
            'avatar',
            'license_number',
            'years_of_experience',
            'bio',
            'appointment_interval'
        ]


# ========================
# PATIENT MANAGEMENT SERIALIZERS
# ========================

class PatientListSerializer(serializers.ModelSerializer):
    """Serializer for patient list view"""
    
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    total_appointments = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id',
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'date_of_birth',
            'age',
            'gender',
            'phone',
            'avatar',
            'blood_type',
            'emergency_contact_name',
            'emergency_contact_phone',
            'created_at',
            'updated_at',
            'total_appointments'
        ]
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"
    
    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            age = today.year - obj.date_of_birth.year
            if today.month < obj.date_of_birth.month or \
               (today.month == obj.date_of_birth.month and today.day < obj.date_of_birth.day):
                age -= 1
            return age
        return None
    
    def get_total_appointments(self, obj):
        return Appointment.objects.filter(patient=obj).count()


class PatientDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed patient view"""
    
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    total_appointments = serializers.SerializerMethodField()
    completed_appointments = serializers.SerializerMethodField()
    upcoming_appointments = serializers.SerializerMethodField()
    cancelled_appointments = serializers.SerializerMethodField()
    recent_appointments = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id',
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'date_of_birth',
            'age',
            'gender',
            'phone',
            'avatar',
            'blood_type',
            'allergies',
            'emergency_contact_name',
            'emergency_contact_phone',
            'time_format',
            'date_format',
            'created_at',
            'updated_at',
            'total_appointments',
            'completed_appointments',
            'upcoming_appointments',
            'cancelled_appointments',
            'recent_appointments'
        ]
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"
    
    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            age = today.year - obj.date_of_birth.year
            if today.month < obj.date_of_birth.month or \
               (today.month == obj.date_of_birth.month and today.day < obj.date_of_birth.day):
                age -= 1
            return age
        return None
    
    def get_total_appointments(self, obj):
        return Appointment.objects.filter(patient=obj).count()
    
    def get_completed_appointments(self, obj):
        return Appointment.objects.filter(
            patient=obj,
            status='completed'
        ).count()
    
    def get_upcoming_appointments(self, obj):
        return Appointment.objects.filter(
            patient=obj,
            status='upcoming'
        ).count()
    
    def get_cancelled_appointments(self, obj):
        return Appointment.objects.filter(
            patient=obj,
            status='cancelled'
        ).count()
    
    def get_recent_appointments(self, obj):
        appointments = Appointment.objects.filter(
            patient=obj
        ).select_related('doctor').order_by('-appointment_date', '-appointment_time')[:5]
        return RecentAppointmentSerializer(appointments, many=True).data


class PatientCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating patients"""
    
    class Meta:
        model = Patient
        fields = [
            'email',
            'first_name',
            'middle_name',
            'last_name',
            'date_of_birth',
            'gender',
            'phone',
            'avatar',
            'blood_type',
            'allergies',
            'emergency_contact_name',
            'emergency_contact_phone',
            'time_format',
            'date_format'
        ]


# ========================
# APPOINTMENT MANAGEMENT SERIALIZERS
# ========================

class AppointmentListSerializer(serializers.ModelSerializer):
    """Serializer for appointment list view"""
    
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_id = serializers.CharField(source='patient.id', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'doctor_specialty',
            'patient',
            'patient_name',
            'patient_id',
            'appointment_date',
            'appointment_time',
            'appointment_type',
            'appointment_mode',
            'status',
            'reason',
            'notes',
            'cancellation_reason',
            'cancelled_by',
            'cancelled_at',
            'reschedule_reason',
            'rescheduled_by',
            'rescheduled_at',
            'appointment_started',
            'patient_joined',
            'prescription_uploaded',
            'created_at',
            'updated_at'
        ]
    
    def get_doctor_name(self, obj):
        middle = f" {obj.doctor.middle_name}" if obj.doctor.middle_name else ""
        return f"{obj.doctor.first_name}{middle} {obj.doctor.last_name}"
    
    def get_patient_name(self, obj):
        middle = f" {obj.patient.middle_name}" if obj.patient.middle_name else ""
        return f"{obj.patient.first_name}{middle} {obj.patient.last_name}"


class AppointmentDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed appointment view"""
    
    doctor_details = DoctorListSerializer(source='doctor', read_only=True)
    patient_details = PatientListSerializer(source='patient', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'doctor',
            'doctor_details',
            'patient',
            'patient_details',
            'appointment_date',
            'appointment_time',
            'appointment_type',
            'appointment_mode',
            'status',
            'reason',
            'notes',
            'cancellation_reason',
            'cancelled_by',
            'cancelled_at',
            'reschedule_reason',
            'rescheduled_by',
            'rescheduled_at',
            'appointment_started',
            'call_status',
            'patient_joined',
            'document_request_status',
            'shared_documents',
            'completion_request_status',
            'prescription_uploaded',
            'created_at',
            'updated_at'
        ]


class AppointmentStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating appointment status"""
    
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    cancellation_reason = serializers.CharField(required=False, allow_blank=True)
    cancelled_by = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        if attrs.get('status') == 'cancelled':
            if not attrs.get('cancellation_reason'):
                raise serializers.ValidationError({
                    'cancellation_reason': 'Cancellation reason is required when cancelling an appointment.'
                })
        return attrs


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments"""
    
    class Meta:
        model = Appointment
        fields = [
            'doctor',
            'patient',
            'appointment_date',
            'appointment_time',
            'appointment_type',
            'appointment_mode',
            'reason',
            'notes'
        ]
    
    def validate(self, attrs):
        # Check if appointment date is not in the past
        if attrs['appointment_date'] < date.today():
            raise serializers.ValidationError({
                'appointment_date': 'Appointment date cannot be in the past.'
            })
        
        # Check if doctor and patient exist
        if not Doctor.objects.filter(id=attrs['doctor'].id).exists():
            raise serializers.ValidationError({
                'doctor': 'Doctor does not exist.'
            })
        
        if not Patient.objects.filter(id=attrs['patient'].id).exists():
            raise serializers.ValidationError({
                'patient': 'Patient does not exist.'
            })
        
        return attrs


# ========================
# SEARCH SERIALIZERS
# ========================

class DoctorSearchSerializer(serializers.ModelSerializer):
    """Serializer for doctor search results"""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = ['id', 'full_name', 'email', 'specialty', 'phone']
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"


class PatientSearchSerializer(serializers.ModelSerializer):
    """Serializer for patient search results"""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = ['id', 'full_name', 'email', 'phone', 'blood_type']
    
    def get_full_name(self, obj):
        middle = f" {obj.middle_name}" if obj.middle_name else ""
        return f"{obj.first_name}{middle} {obj.last_name}"


# ========================
# STATISTICS SERIALIZERS
# ========================

class DoctorStatsSerializer(serializers.Serializer):
    """Serializer for doctor statistics"""
    
    total_doctors = serializers.IntegerField()
    doctors_by_specialty = serializers.DictField()
    average_experience = serializers.FloatField()


class PatientStatsSerializer(serializers.Serializer):
    """Serializer for patient statistics"""
    
    total_patients = serializers.IntegerField()
    new_patients_month = serializers.IntegerField()
    patients_by_gender = serializers.DictField()
    patients_by_blood_type = serializers.DictField()


class AppointmentStatsSerializer(serializers.Serializer):
    """Serializer for appointment statistics"""
    
    total_appointments = serializers.IntegerField()
    upcoming_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    cancelled_appointments = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
    appointments_by_mode = serializers.DictField()


# ========================
# PAYMENT SERIALIZERS
# ========================

class DoctorPricingSerializer(serializers.ModelSerializer):
    """Serializer for doctor consultation pricing"""
    online_consultation_fee = serializers.DecimalField(source='online_fee', max_digits=10, decimal_places=2, required=False)
    in_person_consultation_fee = serializers.DecimalField(source='in_person_fee', max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = DoctorPricing
        fields = ['id', 'doctor', 'online_fee', 'in_person_fee', 'online_consultation_fee', 'in_person_consultation_fee', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'online_fee': {'required': False},
            'in_person_fee': {'required': False},
        }


class DoctorBankAccountSerializer(serializers.ModelSerializer):
    """Serializer for doctor bank accounts"""
    
    class Meta:
        model = DoctorBankAccount
        fields = ['id', 'doctor', 'type', 'bank_name', 'account_title', 'account_number', 'iban', 'phone_number', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientPaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for patient payment methods"""
    
    class Meta:
        model = PatientPaymentMethod
        fields = ['id', 'patient', 'type', 'name', 'account_number', 'iban', 'phone_number', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions"""
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    appointment_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment', 'appointment_id', 'amount', 'mode', 'status', 'payment_method', 'reason', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """Generate transaction ID if not provided"""
        import time
        import random
        
        if 'id' not in validated_data or not validated_data.get('id'):
            # Generate transaction ID: TXN-{timestamp}-{random}
            timestamp = int(time.time())
            random_suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9))
            validated_data['id'] = f"TXN-{timestamp}-{random_suffix}"
        
        return super().create(validated_data)
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"
    
    def get_appointment_id(self, obj):
        return obj.appointment.id if obj.appointment else None


class PaymentRequestSerializer(serializers.ModelSerializer):
    """Serializer for payment requests"""
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentRequest
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment', 'original_appointment', 
                  'appointment_type', 'appointment_date', 'appointment_time', 'appointment_mode', 'location', 
                  'amount', 'reason', 'reschedule_reason', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Generate ID if not provided"""
        import random
        import string
        from django.utils import timezone
        
        if 'id' not in validated_data or not validated_data['id']:
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            validated_data['id'] = f"REQ-{timestamp}-{random_str}"
        
        return super().create(validated_data)
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"


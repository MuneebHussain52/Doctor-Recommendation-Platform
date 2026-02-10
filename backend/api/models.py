from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid
from django.utils import timezone


class Doctor(models.Model):
    TIME_FORMAT_CHOICES = [
        ('12h', '12-hour'),
        ('24h', '24-hour'),
    ]
    DATE_FORMAT_CHOICES = [
        ('DD-MM-YYYY', 'DD-MM-YYYY'),
        ('MM-DD-YYYY', 'MM-DD-YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
    ]
    MONTH_FORMAT_CHOICES = [
        ('number', 'Number'),
        ('name', 'Name'),
    ]
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.CharField(max_length=50, primary_key=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    specialty = models.CharField(max_length=100)
    pending_specialty = models.CharField(max_length=100, null=True, blank=True, help_text='Custom specialty awaiting admin approval')
    phone = models.CharField(max_length=20, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/doctors/', null=True, blank=True)
    license_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    years_of_experience = models.IntegerField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    appointment_interval = models.IntegerField(default=30)  # Appointment duration in minutes
    time_format = models.CharField(max_length=3, choices=TIME_FORMAT_CHOICES, default='24h')
    date_format = models.CharField(max_length=10, choices=DATE_FORMAT_CHOICES, default='DD-MM-YYYY')
    month_format = models.CharField(max_length=6, choices=MONTH_FORMAT_CHOICES, default='number')

    # Professional documents
    national_id = models.FileField(upload_to='documents/doctor_credentials/', null=True, blank=True)
    medical_degree = models.FileField(upload_to='documents/doctor_credentials/', null=True, blank=True)
    medical_license = models.FileField(upload_to='documents/doctor_credentials/', null=True, blank=True)
    specialist_certificates = models.FileField(upload_to='documents/doctor_credentials/', null=True, blank=True)
    proof_of_practice = models.FileField(upload_to='documents/doctor_credentials/', null=True, blank=True)

    # Approval status fields
    approval_status = models.CharField(max_length=10, choices=APPROVAL_STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(default=False)  # Blue tick indicator
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('AdminUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_doctors')
    rejection_reason = models.TextField(null=True, blank=True)

    # Blocking status fields
    is_blocked = models.BooleanField(default=False)
    block_reason = models.TextField(null=True, blank=True)
    blocked_at = models.DateTimeField(null=True, blank=True)
    blocked_by = models.ForeignKey('AdminUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='blocked_doctors')

    # Ranking and sentiment analysis fields
    sentiment_score = models.FloatField(default=0.0, help_text='Sentiment score from feedback analysis (0-100, default 0 until Phase 3)')
    sentiment_updated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors'

    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name}"


class Patient(models.Model):
    TIME_FORMAT_CHOICES = [
        ('12h', '12-hour'),
        ('24h', '24-hour'),
    ]
    DATE_FORMAT_CHOICES = [
        ('MM-DD-YYYY', 'MM-DD-YYYY'),
        ('DD-MM-YYYY', 'DD-MM-YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
    ]

    id = models.CharField(max_length=50, primary_key=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/patients/', null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, null=True, blank=True)
    blood_type = models.CharField(max_length=5, null=True, blank=True)
    allergies = ArrayField(models.TextField(), null=True, blank=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    time_format = models.CharField(max_length=3, choices=TIME_FORMAT_CHOICES, default='12h')
    date_format = models.CharField(max_length=10, choices=DATE_FORMAT_CHOICES, default='MM-DD-YYYY')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class HospitalLocation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='hospital_locations')
    name = models.CharField(max_length=200)
    address = models.TextField()  # Complete address including street, city, state
    phone = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hospital_locations'

    def __str__(self):
        return self.name


class AppointmentSlot(models.Model):
    APPOINTMENT_MODE_CHOICES = [
        ('online', 'Online'),
        ('in-person', 'In-Person'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointment_slots')
    day_of_week = models.CharField(max_length=10)
    start_time = models.TimeField()
    end_time = models.TimeField()
    mode = models.CharField(max_length=10, choices=APPOINTMENT_MODE_CHOICES)
    location = models.ForeignKey(HospitalLocation, on_delete=models.SET_NULL, null=True, blank=True, related_name='slots')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointment_slots'

    def __str__(self):
        return f"{self.doctor} - {self.day_of_week} ({self.start_time}-{self.end_time}) [{self.mode}]"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    MODE_CHOICES = [
        ('online', 'Online'),
        ('in-person', 'In-Person'),
    ]

    id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    appointment_type = models.CharField(max_length=50)
    appointment_mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='online')
    location = models.ForeignKey(HospitalLocation, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    reason = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    cancelled_by = models.CharField(max_length=20, null=True, blank=True)  # 'patient', 'doctor', or 'admin'
    cancelled_at = models.DateTimeField(null=True, blank=True)
    reschedule_reason = models.TextField(null=True, blank=True)
    rescheduled_by = models.CharField(max_length=20, null=True, blank=True)  # 'patient', 'doctor', or 'admin'
    rescheduled_at = models.DateTimeField(null=True, blank=True)
    original_date = models.DateField(null=True, blank=True)
    original_time = models.TimeField(null=True, blank=True)
    appointment_started = models.BooleanField(default=False)
    video_call_started = models.BooleanField(default=False)  # Track if video call has been initiated
    call_status = models.CharField(max_length=20, null=True, blank=True)
    patient_joined = models.BooleanField(default=False)
    document_request_status = models.CharField(max_length=20, null=True, blank=True)
    shared_documents = models.TextField(null=True, blank=True)
    completion_request_status = models.CharField(max_length=20, null=True, blank=True)  # 'requested', 'accepted', 'rejected'
    prescription_uploaded = models.BooleanField(default=False)
    prescription = models.FileField(upload_to='prescriptions/', null=True, blank=True)  # Store prescription file
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-appointment_date', '-appointment_time']

    def __str__(self):
        return f"{self.patient} - {self.doctor} on {self.appointment_date}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking', 'Booking'),
        ('system', 'System'),
        ('message', 'Message'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=10, default='doctor')  # 'patient' or 'doctor'
    user_id = models.CharField(max_length=50, null=True)  # ID of patient or doctor (can be string like 'dr686039')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.title}"


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='feedback')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='feedback_given')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='feedback_received')
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    doctor_reply = models.TextField(null=True, blank=True)
    patient_reply = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    doctor_reply_at = models.DateTimeField(null=True, blank=True)
    patient_reply_at = models.DateTimeField(null=True, blank=True)
    doctor_reply_to_patient = models.TextField(null=True, blank=True)
    doctor_reply_to_patient_at = models.DateTimeField(null=True, blank=True)

    # Deletion tracking fields
    doctor_reply_deleted_at = models.DateTimeField(null=True, blank=True)
    patient_reply_deleted_at = models.DateTimeField(null=True, blank=True)
    doctor_reply_to_patient_deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback for {self.doctor} - Rating: {self.rating}"


class FeedbackMessage(models.Model):
    SENDER_TYPE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPE_CHOICES)
    message_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.CharField(max_length=10, null=True, blank=True)  # 'patient' or 'doctor'

    class Meta:
        db_table = 'feedback_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type} message on {self.feedback.id}"


class MedicalDocument(models.Model):
    CATEGORY_CHOICES = [
        ('Other', 'Other'),
        ('Image', 'Image'),
        ('Lab Report', 'Lab Report'),
        ('Prescription', 'Prescription'),
        ('Medical Record', 'Medical Record'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='documents')
    appointment = models.ForeignKey('Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')  # Link to specific appointment
    document_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'medical_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.document_name} - {self.patient}"


class Symptom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='symptoms')
    symptom_description = models.TextField()
    severity = models.CharField(max_length=20, null=True, blank=True)
    body_part = models.CharField(max_length=50, null=True, blank=True)
    duration = models.CharField(max_length=50, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'symptoms'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.patient} - {self.symptom_description[:50]}"


class PatientNotification(models.Model):
    CATEGORY_CHOICES = [
        ('system', 'System'),
        ('appointment', 'Appointment'),
        ('feedback', 'Feedback'),
        ('message', 'Message'),
        ('general', 'General'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='patient_notifications')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient} - {self.title}"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender_type = models.CharField(max_length=10)  # 'patient' or 'doctor'
    sender_id = models.CharField(max_length=50)  # ID of sender
    receiver_type = models.CharField(max_length=10)  # 'patient' or 'doctor'
    receiver_id = models.CharField(max_length=50)  # ID of receiver
    text = models.TextField(null=True, blank=True)
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    attachment_type = models.CharField(max_length=100, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type} to {self.receiver_type} - {self.created_at}"
    


\




class AdminUserManager(BaseUserManager):
    """Manager for custom Admin users"""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular admin user"""
        if not email:
            raise ValueError('An admin must have an email address.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class AdminUser(AbstractBaseUser, PermissionsMixin):
    """Custom Admin model for managing doctors and patients"""

    # Basic info
    email = models.EmailField(unique=True, max_length=255)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    # Optional profile info
    profile_picture = models.ImageField(upload_to='admin_profiles/', blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=50, default='Admin', editable=False)

    # Permissions & status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)  # Required for Django admin access
    is_superuser = models.BooleanField(default=False)

    # Tracking
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    # Activity logs (optional, for analytics)
    total_logins = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, null=True, help_text="Internal notes for admin use")

    objects = AdminUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'
        ordering = ['-date_joined']
        db_table = 'admin_users'

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    def get_full_name(self):
        """Return the admin's full name"""
        return self.full_name

    def get_short_name(self):
        """Return the admin's first name"""
        return self.full_name.split(' ')[0] if self.full_name else self.email

    def record_login(self):
        """Custom helper: increment login count"""
        self.total_logins += 1
        self.last_login = timezone.now()
        self.save(update_fields=['total_logins', 'last_login'])


class DoctorBlockingAuditLog(models.Model):
    """
    Audit trail for doctor blocking and unblocking actions.
    Stores complete history of all blocking/unblocking events.
    """
    ACTION_CHOICES = [
        ('blocked', 'Blocked'),
        ('unblocked', 'Unblocked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='blocking_history')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    reason = models.TextField(null=True, blank=True)  # Only for 'blocked' actions
    performed_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, related_name='blocking_actions')
    performed_at = models.DateTimeField(auto_now_add=True)

    # Store doctor info at time of action (for historical reference)
    doctor_name = models.CharField(max_length=200)
    doctor_email = models.EmailField()
    doctor_specialty = models.CharField(max_length=100)

    # Store admin info at time of action
    admin_name = models.CharField(max_length=100)
    admin_email = models.EmailField()

    class Meta:
        db_table = 'doctor_blocking_audit_log'
        ordering = ['-performed_at']
        verbose_name = 'Doctor Blocking Audit Log'
        verbose_name_plural = 'Doctor Blocking Audit Logs'

    def __str__(self):
        return f"{self.action.title()} - {self.doctor_name} by {self.admin_name} at {self.performed_at}"


class Specialty(models.Model):
    """
    Model for managing CUSTOM medical specialties only.
    
    Core specialties are hardcoded in api.constants.CORE_SPECIALTIES and do not need database storage.
    This model only stores custom specialties that doctors request through the "Other" option
    during registration, which require admin approval.
    
    Workflow:
    1. Doctor selects "Other" during signup and types custom specialty name
    2. Entry created here with approval_status='pending'
    3. Admin approves/rejects via admin panel
    4. If approved, specialty becomes available in dropdowns alongside core specialties
    """
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    is_predefined = models.BooleanField(default=False, help_text='Should always be False - core specialties are in constants.py')
    approval_status = models.CharField(max_length=10, choices=APPROVAL_STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='requested_specialties')
    approved_by = models.ForeignKey('AdminUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_specialties')
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'specialties'
        ordering = ['name']
        verbose_name = 'Specialty'
        verbose_name_plural = 'Specialties'

    def __str__(self):
        return f"{self.name} ({self.approval_status})"


class FavoriteDoctor(models.Model):
    """Model to store patient's favorite doctors"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='favorite_doctors')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'favorite_doctors'
        unique_together = ('patient', 'doctor')  # Ensure a patient can favorite a doctor only once
        ordering = ['-created_at']
        verbose_name = 'Favorite Doctor'
        verbose_name_plural = 'Favorite Doctors'

    def __str__(self):
        return f"{self.patient.first_name} {self.patient.last_name} -> Dr. {self.doctor.first_name} {self.doctor.last_name}"


class DoctorPricing(models.Model):
    """Model to store doctor consultation fees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE, related_name='pricing')
    online_fee = models.DecimalField(max_digits=10, decimal_places=2, default=1500.00)
    in_person_fee = models.DecimalField(max_digits=10, decimal_places=2, default=2500.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_pricing'
        verbose_name = 'Doctor Pricing'
        verbose_name_plural = 'Doctor Pricing'

    def __str__(self):
        return f"{self.doctor} - Online: Rs.{self.online_fee}, In-Person: Rs.{self.in_person_fee}"


class DoctorBankAccount(models.Model):
    """Model to store doctor's bank accounts and mobile wallets"""
    PAYMENT_TYPE_CHOICES = [
        ('bank', 'Bank Account'),
        ('mobile-wallet', 'Mobile Wallet'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='bank_accounts')
    type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='bank')
    bank_name = models.CharField(max_length=100)
    account_title = models.CharField(max_length=200, null=True, blank=True)
    account_number = models.CharField(max_length=50, null=True, blank=True)
    iban = models.CharField(max_length=50, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_bank_accounts'
        verbose_name = 'Doctor Bank Account'
        verbose_name_plural = 'Doctor Bank Accounts'

    def __str__(self):
        if self.type == 'mobile-wallet':
            return f"{self.doctor} - {self.bank_name} ({self.phone_number})"
        return f"{self.doctor} - {self.bank_name} ({self.account_number})"


class PatientPaymentMethod(models.Model):
    """Model to store patient's payment methods"""
    PAYMENT_TYPE_CHOICES = [
        ('bank', 'Bank Account'),
        ('mobile-wallet', 'Mobile Wallet'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payment_methods')
    type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    name = models.CharField(max_length=100)  # Bank name or wallet name
    account_number = models.CharField(max_length=50, null=True, blank=True)  # For bank accounts
    iban = models.CharField(max_length=50, null=True, blank=True)  # For bank accounts
    phone_number = models.CharField(max_length=20, null=True, blank=True)  # For mobile wallets
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_payment_methods'
        verbose_name = 'Patient Payment Method'
        verbose_name_plural = 'Patient Payment Methods'

    def __str__(self):
        return f"{self.patient} - {self.name}"


class Transaction(models.Model):
    """Model to store all payment transactions"""
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    MODE_CHOICES = [
        ('online', 'Online'),
        ('in-person', 'In-Person'),
    ]

    id = models.CharField(max_length=100, primary_key=True)  # Format: TXN-{timestamp}-{random}
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='transactions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='transactions')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    payment_method = models.CharField(max_length=100)
    reason = models.TextField(null=True, blank=True)  # For refunds or special cases
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    def __str__(self):
        return f"{self.id} - {self.patient} to {self.doctor} - Rs.{self.amount}"


class PaymentRequest(models.Model):
    """Model to store payment requests for follow-ups and rescheduled appointments"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('declined', 'Declined'),
    ]

    id = models.CharField(max_length=100, primary_key=True)  # Format: REQ-{timestamp}-{random}
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payment_requests')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='payment_requests')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_requests')
    original_appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='original_for_requests')
    
    # Appointment details for creating after payment
    appointment_type = models.CharField(max_length=100)
    appointment_date = models.DateField(null=True, blank=True)
    appointment_time = models.TimeField(null=True, blank=True)
    appointment_mode = models.CharField(max_length=20, null=True, blank=True)
    location = models.ForeignKey(HospitalLocation, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    reschedule_reason = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_requests'
        ordering = ['-created_at']
        verbose_name = 'Payment Request'
        verbose_name_plural = 'Payment Requests'

    def __str__(self):
        return f"{self.id} - {self.doctor} to {self.patient} - Rs.{self.amount}"

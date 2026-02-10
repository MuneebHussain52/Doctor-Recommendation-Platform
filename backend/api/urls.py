from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Health Check
    health_check,
    
    # Doctor & Patient Auth (EXISTING)
    doctor_login,
    doctor_register,
    patient_login,
    patient_register,
    patient_change_password,
    
    # ViewSets (EXISTING)
    DoctorViewSet,
    PatientViewSet,
    AppointmentViewSet,
    FeedbackViewSet,
    NotificationViewSet,
    MessageViewSet,
    
    # Payment ViewSets
    DoctorPricingViewSet,
    DoctorBankAccountViewSet,
    PatientPaymentMethodViewSet,
    TransactionViewSet,
    PaymentRequestViewSet,
    
    # Feedback Messages (EXISTING)
    update_feedback_message,
    delete_feedback_message,
    
    # Admin Authentication
    AdminLoginAPIView,
    AdminLogoutAPIView,
    AdminRegisterAPIView,
    
    # Admin Dashboard
    AdminDashboardAPIView,
    DashboardStatsAPIView,
    
    # Admin Doctors Management
    AdminDoctorListAPIView,
    AdminDoctorDetailAPIView,
    AdminDoctorCreateAPIView,
    AdminDoctorUpdateAPIView,
    AdminDoctorDeleteAPIView,
    AdminDoctorStatsAPIView,
    AdminDoctorAppointmentsAPIView,
    AdminBlockDoctorAPIView,
    AdminUnblockDoctorAPIView,
    DoctorBlockingAuditLogAPIView,
    
    # Admin Patients Management
    AdminPatientListAPIView,
    AdminPatientDetailAPIView,
    AdminPatientCreateAPIView,
    AdminPatientUpdateAPIView,
    AdminPatientDeleteAPIView,
    AdminPatientStatsAPIView,
    
    # Admin Appointments Management
    AdminAppointmentListAPIView,
    AdminAppointmentDetailAPIView,
    AdminAppointmentCreateAPIView,
    AdminAppointmentUpdateStatusAPIView,
    AdminAppointmentDeleteAPIView,
    AdminAppointmentStatsAPIView,
    AdminCancelAppointmentAPIView,
    AdminRescheduleAppointmentAPIView,
    
    # Admin Search & Filter
    AdminSearchDoctorsAPIView,
    AdminSearchPatientsAPIView,
    
    # Admin Profile & Settings
    AdminProfileAPIView,
    AdminChangePasswordAPIView,

    # Doctor Approval Management
    DoctorApprovalListAPIView,
    DoctorApprovalDetailAPIView,
    DoctorApproveAPIView,
    DoctorRejectAPIView,
    DoctorApprovalStatsAPIView,
    
    # Specialty Management
    SpecialtyListAPIView,
    PendingSpecialtyListAPIView,
    ApproveSpecialtyAPIView,
    RejectSpecialtyAPIView,
    
    # Patient Favorites
    PatientFavoritesListAPIView,
    AddFavoriteDoctorAPIView,
    RemoveFavoriteDoctorAPIView,
    
    # Email availability check
    check_email,
)
from .ml_predict import predict_specialist

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'doctor-pricing', DoctorPricingViewSet, basename='doctor-pricing')
router.register(r'doctor-bank-accounts', DoctorBankAccountViewSet, basename='doctor-bank-account')
router.register(r'patient-payment-methods', PatientPaymentMethodViewSet, basename='patient-payment-method')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'payment-requests', PaymentRequestViewSet, basename='payment-request')

urlpatterns = [
    # ========================
    # HEALTH CHECK
    # ========================
    path('health/', health_check, name='health-check'),
    
    # ========================
    # DOCTOR & PATIENT AUTH (EXISTING)
    # ========================
    path('auth/doctor/login/', doctor_login, name='doctor-login'),
    path('auth/doctor/register/', doctor_register, name='doctor-register'),
    path('auth/check-email/', check_email, name='check-email'),
    path('auth/patient/login/', patient_login, name='patient-login'),
    path('auth/patient/register/', patient_register, name='patient-register'),
    path('auth/patient/change-password/', patient_change_password, name='patient-change-password'),
    
    # ========================
    # FEEDBACK MESSAGES (EXISTING)
    # ========================
    path('feedback-messages/<str:message_id>/', update_feedback_message, name='update-feedback-message'),
    path('feedback-messages/<str:message_id>/delete/', delete_feedback_message, name='delete-feedback-message'),
    
    # ========================
    # ADMIN AUTHENTICATION
    # ========================
    path('admin/auth/login/', AdminLoginAPIView.as_view(), name='admin-login'),
    path('admin/auth/logout/', AdminLogoutAPIView.as_view(), name='admin-logout'),
    path('admin/auth/register/', AdminRegisterAPIView.as_view(), name='admin-register'),
    
    # ========================
    # ADMIN DASHBOARD
    # ========================
    path('admin/dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('admin/dashboard/stats/', DashboardStatsAPIView.as_view(), name='admin-dashboard-stats'),
    
    # ========================
    # ADMIN DOCTORS MANAGEMENT
    # ========================
    path('admin/doctors/', AdminDoctorListAPIView.as_view(), name='admin-doctors-list'),
    path('admin/doctors/create/', AdminDoctorCreateAPIView.as_view(), name='admin-doctor-create'),
    path('admin/doctors/stats/', AdminDoctorStatsAPIView.as_view(), name='admin-doctors-stats'),
    path('admin/doctors/<str:doctor_id>/', AdminDoctorDetailAPIView.as_view(), name='admin-doctor-detail'),
    path('admin/doctors/<str:doctor_id>/update/', AdminDoctorUpdateAPIView.as_view(), name='admin-doctor-update'),
    path('admin/doctors/<str:doctor_id>/delete/', AdminDoctorDeleteAPIView.as_view(), name='admin-doctor-delete'),
    path('admin/doctors/<str:doctor_id>/appointments/', AdminDoctorAppointmentsAPIView.as_view(), name='admin-doctor-appointments'),
    path('admin/doctors/<str:doctor_id>/block/', AdminBlockDoctorAPIView.as_view(), name='admin-doctor-block'),
    path('admin/doctors/<str:doctor_id>/unblock/', AdminUnblockDoctorAPIView.as_view(), name='admin-doctor-unblock'),
    path('admin/audit-log/', DoctorBlockingAuditLogAPIView.as_view(), name='admin-audit-log'),
    
    # ========================
    # ADMIN PATIENTS MANAGEMENT
    # ========================
    path('admin/patients/', AdminPatientListAPIView.as_view(), name='admin-patients-list'),
    path('admin/patients/create/', AdminPatientCreateAPIView.as_view(), name='admin-patient-create'),
    path('admin/patients/stats/', AdminPatientStatsAPIView.as_view(), name='admin-patients-stats'),
    path('admin/patients/<str:patient_id>/', AdminPatientDetailAPIView.as_view(), name='admin-patient-detail'),
    path('admin/patients/<str:patient_id>/update/', AdminPatientUpdateAPIView.as_view(), name='admin-patient-update'),
    path('admin/patients/<str:patient_id>/delete/', AdminPatientDeleteAPIView.as_view(), name='admin-patient-delete'),
    
    # ========================
    # ADMIN APPOINTMENTS MANAGEMENT
    # ========================
    path('admin/appointments/', AdminAppointmentListAPIView.as_view(), name='admin-appointments-list'),
    path('admin/appointments/create/', AdminAppointmentCreateAPIView.as_view(), name='admin-appointment-create'),
    path('admin/appointments/stats/', AdminAppointmentStatsAPIView.as_view(), name='admin-appointments-stats'),
    path('admin/appointments/<str:appointment_id>/', AdminAppointmentDetailAPIView.as_view(), name='admin-appointment-detail'),
    path('admin/appointments/<str:appointment_id>/update-status/', AdminAppointmentUpdateStatusAPIView.as_view(), name='admin-appointment-update-status'),
    path('admin/appointments/<str:appointment_id>/delete/', AdminAppointmentDeleteAPIView.as_view(), name='admin-appointment-delete'),
    path('admin/appointments/<str:appointment_id>/cancel/', AdminCancelAppointmentAPIView.as_view(), name='admin-appointment-cancel'),
    path('admin/appointments/<str:appointment_id>/reschedule/', AdminRescheduleAppointmentAPIView.as_view(), name='admin-appointment-reschedule'),
    
    # ========================
    # ADMIN SEARCH
    # ========================
    path('admin/search/doctors/', AdminSearchDoctorsAPIView.as_view(), name='admin-search-doctors'),
    path('admin/search/patients/', AdminSearchPatientsAPIView.as_view(), name='admin-search-patients'),
    
    # ========================
    # ADMIN PROFILE & SETTINGS
    # ========================
    path('admin/profile/', AdminProfileAPIView.as_view(), name='admin-profile'),
    path('admin/change-password/', AdminChangePasswordAPIView.as_view(), name='admin-change-password'),

    # ========================
    # DOCTOR APPROVAL MANAGEMENT
    # ========================
    path('admin/approvals/', DoctorApprovalListAPIView.as_view(), name='admin-approvals-list'),
    path('admin/approvals/stats/', DoctorApprovalStatsAPIView.as_view(), name='admin-approvals-stats'),
    path('admin/approvals/<str:doctor_id>/', DoctorApprovalDetailAPIView.as_view(), name='admin-approval-detail'),
    path('admin/approvals/<str:doctor_id>/approve/', DoctorApproveAPIView.as_view(), name='admin-doctor-approve'),
    path('admin/approvals/<str:doctor_id>/reject/', DoctorRejectAPIView.as_view(), name='admin-doctor-reject'),

    # ========================
    # SPECIALTY MANAGEMENT
    # ========================
    path('specialties/', SpecialtyListAPIView.as_view(), name='specialty-list'),
    path('admin/specialties/pending/', PendingSpecialtyListAPIView.as_view(), name='admin-pending-specialties'),
    path('admin/specialties/<str:specialty_id>/approve/', ApproveSpecialtyAPIView.as_view(), name='admin-approve-specialty'),
    path('admin/specialties/<str:specialty_id>/reject/', RejectSpecialtyAPIView.as_view(), name='admin-reject-specialty'),

    # ========================
    # PATIENT FAVORITES
    # ========================
    path('patients/<str:patient_id>/favorites/', PatientFavoritesListAPIView.as_view(), name='patient-favorites-list'),
    path('patients/<str:patient_id>/favorites/<str:doctor_id>/add/', AddFavoriteDoctorAPIView.as_view(), name='patient-add-favorite'),
    path('patients/<str:patient_id>/favorites/<str:doctor_id>/remove/', RemoveFavoriteDoctorAPIView.as_view(), name='patient-remove-favorite'),

    # ========================
    # ML SPECIALIST PREDICTION
    # ========================
    path('predict-specialist/', predict_specialist, name='predict-specialist'),

    # ========================
    # ROUTER URLS (EXISTING)
    # ========================
    path('', include(router.urls)),
]
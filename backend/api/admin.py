from django.contrib import admin
from .models import Doctor, Patient, Appointment, Feedback, MedicalDocument, Symptom, Specialty, FavoriteDoctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'specialty', 'email', 'phone')
    search_fields = ('first_name', 'last_name', 'email', 'specialty')
    list_filter = ('specialty',)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'phone', 'blood_type')
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('blood_type', 'gender')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'appointment_date', 'appointment_time', 'status')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name')
    list_filter = ('status', 'appointment_type', 'appointment_date')
    date_hierarchy = 'appointment_date'


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('doctor__first_name', 'doctor__last_name', 'patient__first_name', 'patient__last_name')


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ('document_name', 'patient', 'category', 'uploaded_at')
    list_filter = ('category', 'uploaded_at')
    search_fields = ('document_name', 'patient__first_name', 'patient__last_name')


@admin.register(Symptom)
class SymptomAdmin(admin.ModelAdmin):
    list_display = ('patient', 'symptom_description', 'severity', 'body_part', 'submitted_at')
    list_filter = ('severity', 'body_part', 'submitted_at')
    search_fields = ('patient__first_name', 'patient__last_name', 'symptom_description')

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'approval_status', 'is_predefined', 'requested_by', 'approved_by', 'created_at')
    list_filter = ('approval_status', 'is_predefined', 'created_at')
    search_fields = ('name', 'requested_by__first_name', 'requested_by__last_name')
    readonly_fields = ('created_at', 'approved_at')

@admin.register(FavoriteDoctor)
class FavoriteDoctorAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name')
    readonly_fields = ('created_at',)

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from api.models import Doctor, Patient, WorkingHours, Appointment, Feedback, MedicalDocument, Symptom


class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing data...')
        # Clear existing data
        Feedback.objects.all().delete()
        Appointment.objects.all().delete()
        WorkingHours.objects.all().delete()
        MedicalDocument.objects.all().delete()
        Symptom.objects.all().delete()
        Patient.objects.all().delete()
        Doctor.objects.all().delete()

        self.stdout.write('Creating doctors...')
        # Create doctors
        doctors_data = [
            {'id': 'dr1', 'email': 'sarah.chen@hospital.com', 'first_name': 'Sarah', 'last_name': 'Chen', 'specialty': 'Cardiologist', 'phone': '+1234567890', 'license_number': 'DOC001', 'years_of_experience': 15, 'avatar': 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'},
            {'id': 'dr2', 'email': 'michael.rodriguez@hospital.com', 'first_name': 'Michael', 'last_name': 'Rodriguez', 'specialty': 'General Physician', 'phone': '+1234567891', 'license_number': 'DOC002', 'years_of_experience': 10, 'avatar': 'https://images.pexels.com/photos/6749778/pexels-photo-6749778.jpeg'},
            {'id': 'dr3', 'email': 'lisa.wang@hospital.com', 'first_name': 'Lisa', 'last_name': 'Wang', 'specialty': 'Dermatologist', 'phone': '+1234567892', 'license_number': 'DOC003', 'years_of_experience': 12},
            {'id': 'dr4', 'email': 'james.wilson@hospital.com', 'first_name': 'James', 'last_name': 'Wilson', 'specialty': 'Orthopedic Surgeon', 'phone': '+1234567893', 'license_number': 'DOC004', 'years_of_experience': 18, 'avatar': 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg'},
            {'id': 'dr5', 'email': 'priya.singh@hospital.com', 'first_name': 'Priya', 'last_name': 'Singh', 'specialty': 'Pediatrician', 'phone': '+1234567894', 'license_number': 'DOC005', 'years_of_experience': 8, 'avatar': 'https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg'},
            {'id': 'dr6', 'email': 'ahmed.khan@hospital.com', 'first_name': 'Ahmed', 'last_name': 'Khan', 'specialty': 'Neurologist', 'phone': '+1234567895', 'license_number': 'DOC006', 'years_of_experience': 14, 'avatar': 'https://images.pexels.com/photos/1139775/pexels-photo-1139775.jpeg'},
            {'id': 'dr7', 'email': 'emily.brown@hospital.com', 'first_name': 'Emily', 'last_name': 'Brown', 'specialty': 'Endocrinologist', 'phone': '+1234567896', 'license_number': 'DOC007', 'years_of_experience': 11, 'avatar': 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg'},
            {'id': 'dr8', 'email': 'john.lee@hospital.com', 'first_name': 'John', 'last_name': 'Lee', 'specialty': 'Gastroenterologist', 'phone': '+1234567897', 'license_number': 'DOC008', 'years_of_experience': 13, 'avatar': 'https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg'},
            {'id': 'dr9', 'email': 'olivia.green@hospital.com', 'first_name': 'Olivia', 'last_name': 'Green', 'specialty': 'Pulmonologist', 'phone': '+1234567898', 'license_number': 'DOC009', 'years_of_experience': 9, 'avatar': 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg'},
            {'id': 'dr10', 'email': 'henry.adams@hospital.com', 'first_name': 'Henry', 'last_name': 'Adams', 'specialty': 'Urologist', 'phone': '+1234567899', 'license_number': 'DOC010', 'years_of_experience': 16, 'avatar': 'https://images.pexels.com/photos/1139775/pexels-photo-1139775.jpeg'},
            {'id': 'dr11', 'email': 'maria.lopez@hospital.com', 'first_name': 'Maria', 'last_name': 'Lopez', 'specialty': 'Gynecologist', 'phone': '+1234567800', 'license_number': 'DOC011', 'years_of_experience': 12, 'avatar': 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg'},
            {'id': 'dr12', 'email': 'samuel.kim@hospital.com', 'first_name': 'Samuel', 'last_name': 'Kim', 'specialty': 'Ophthalmologist', 'phone': '+1234567801', 'license_number': 'DOC012', 'years_of_experience': 10, 'avatar': 'https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg'},
            {'id': 'dr13', 'email': 'william.scott@hospital.com', 'first_name': 'William', 'last_name': 'Scott', 'specialty': 'Dentist', 'phone': '+1234567802', 'license_number': 'DOC013', 'years_of_experience': 7, 'avatar': 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg'},
            {'id': 'dr14', 'email': 'chloe.turner@hospital.com', 'first_name': 'Chloe', 'last_name': 'Turner', 'specialty': 'Psychiatrist', 'phone': '+1234567803', 'license_number': 'DOC014', 'years_of_experience': 15, 'avatar': 'https://images.pexels.com/photos/1139775/pexels-photo-1139775.jpeg'},
        ]

        doctors = {}
        for doctor_data in doctors_data:
            doctor = Doctor.objects.create(
                password='$2a$10$exampleHashedPassword',
                bio=f'{doctor_data["specialty"]} with {doctor_data["years_of_experience"]} years of experience.',
                **doctor_data
            )
            doctors[doctor_data['id']] = doctor

        self.stdout.write(f'Created {len(doctors)} doctors')

        self.stdout.write('Creating patients...')
        # Create patients
        patients_data = [
            {'id': 'p1', 'email': 'james.wilson.patient@email.com', 'first_name': 'James', 'last_name': 'Wilson', 'date_of_birth': '1985-03-15', 'gender': 'Male', 'phone': '+1111111111', 'blood_type': 'O+', 'avatar': 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg'},
            {'id': 'p2', 'email': 'olivia.martinez@email.com', 'first_name': 'Olivia', 'last_name': 'Martinez', 'date_of_birth': '1990-07-22', 'gender': 'Female', 'phone': '+1111111112', 'blood_type': 'A+'},
            {'id': 'p3', 'email': 'daniel.thompson@email.com', 'first_name': 'Daniel', 'last_name': 'Thompson', 'date_of_birth': '1982-11-08', 'gender': 'Male', 'phone': '+1111111113', 'blood_type': 'B+', 'avatar': 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg'},
            {'id': 'p4', 'email': 'sophia.lee@email.com', 'first_name': 'Sophia', 'last_name': 'Lee', 'date_of_birth': '1995-05-12', 'gender': 'Female', 'phone': '+1111111114', 'blood_type': 'AB+'},
            {'id': 'p5', 'email': 'michael.brown@email.com', 'first_name': 'Michael', 'last_name': 'Brown', 'date_of_birth': '1988-09-30', 'gender': 'Male', 'phone': '+1111111115', 'blood_type': 'O-', 'avatar': 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'},
            {'id': 'p6', 'email': 'emily.clark@email.com', 'first_name': 'Emily', 'last_name': 'Clark', 'date_of_birth': '1992-02-18', 'gender': 'Female', 'phone': '+1111111116', 'blood_type': 'A-'},
            {'id': 'p7', 'email': 'william.scott.patient@email.com', 'first_name': 'William', 'last_name': 'Scott', 'date_of_birth': '1980-12-25', 'gender': 'Male', 'phone': '+1111111117', 'blood_type': 'B-'},
            {'id': 'p8', 'email': 'ava.patel@email.com', 'first_name': 'Ava', 'last_name': 'Patel', 'date_of_birth': '1993-06-14', 'gender': 'Female', 'phone': '+1111111118', 'blood_type': 'AB-', 'avatar': 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg'},
            {'id': 'p9', 'email': 'benjamin.evans@email.com', 'first_name': 'Benjamin', 'last_name': 'Evans', 'date_of_birth': '1987-04-09', 'gender': 'Male', 'phone': '+1111111119', 'blood_type': 'O+'},
            {'id': 'p10', 'email': 'mia.turner@email.com', 'first_name': 'Mia', 'last_name': 'Turner', 'date_of_birth': '1991-08-27', 'gender': 'Female', 'phone': '+1111111120', 'blood_type': 'A+', 'avatar': 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'},
        ]

        patients = {}
        for patient_data in patients_data:
            patient = Patient.objects.create(
                password='$2a$10$exampleHashedPassword',
                **patient_data
            )
            patients[patient_data['id']] = patient

        self.stdout.write(f'Created {len(patients)} patients')

        self.stdout.write('Creating working hours...')
        # Working hours for Dr. Chen
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for day in days:
            WorkingHours.objects.create(
                doctor=doctors['dr1'],
                day_of_week=day,
                start_time='09:00',
                end_time='17:00',
                is_available=True
            )

        # Working hours for Dr. Rodriguez
        for day in days:
            WorkingHours.objects.create(
                doctor=doctors['dr2'],
                day_of_week=day,
                start_time='08:00',
                end_time='16:00',
                is_available=True
            )

        self.stdout.write('Created working hours')

        self.stdout.write('Creating appointments...')
        # Appointments
        today = date.today()
        appointments_data = [
            {'id': 'apt1', 'patient': 'p1', 'doctor': 'dr1', 'appointment_date': '2024-01-15', 'appointment_time': '10:30', 'appointment_type': 'Follow-up', 'status': 'upcoming', 'reason': 'Chest pain, shortness of breath'},
            {'id': 'apt2', 'patient': 'p1', 'doctor': 'dr2', 'appointment_date': '2024-01-20', 'appointment_time': '14:00', 'appointment_type': 'Consultation', 'status': 'upcoming', 'reason': 'General checkup'},
            {'id': 'apt3', 'patient': 'p1', 'doctor': 'dr1', 'appointment_date': '2024-01-05', 'appointment_time': '11:00', 'appointment_type': 'Consultation', 'status': 'completed', 'reason': 'Chest pain evaluation', 'notes': 'Patient responded well to treatment.'},
            {'id': 'apt16', 'patient': 'p2', 'doctor': 'dr1', 'appointment_date': today, 'appointment_time': '09:00', 'appointment_type': 'Consultation', 'status': 'upcoming', 'reason': 'Heart palpitations'},
            {'id': 'apt17', 'patient': 'p3', 'doctor': 'dr1', 'appointment_date': today, 'appointment_time': '11:30', 'appointment_type': 'Follow-up', 'status': 'upcoming', 'reason': 'Post-surgery checkup'},
            {'id': 'apt18', 'patient': 'p4', 'doctor': 'dr1', 'appointment_date': today + timedelta(days=1), 'appointment_time': '10:00', 'appointment_type': 'Consultation', 'status': 'upcoming', 'reason': 'Chest discomfort'},
            {'id': 'apt19', 'patient': 'p5', 'doctor': 'dr1', 'appointment_date': today - timedelta(days=2), 'appointment_time': '14:00', 'appointment_type': 'Consultation', 'status': 'completed', 'reason': 'High blood pressure', 'notes': 'Patient prescribed medication.'},
            {'id': 'apt20', 'patient': 'p6', 'doctor': 'dr1', 'appointment_date': today - timedelta(days=5), 'appointment_time': '09:30', 'appointment_type': 'Follow-up', 'status': 'completed', 'reason': 'Cardiac monitoring', 'notes': 'Heart rate stable.'},
        ]

        created_appointments = {}
        for apt_data in appointments_data:
            patient_id = apt_data.pop('patient')
            doctor_id = apt_data.pop('doctor')
            apt = Appointment.objects.create(
                patient=patients[patient_id],
                doctor=doctors[doctor_id],
                **apt_data
            )
            created_appointments[apt.id] = apt

        self.stdout.write(f'Created {len(created_appointments)} appointments')

        self.stdout.write('Creating feedback...')
        # Feedback
        feedback_data = [
            {'appointment': 'apt19', 'patient': 'p5', 'doctor': 'dr1', 'rating': 5, 'comment': 'Dr. Chen is extremely knowledgeable and took the time to explain everything in detail.'},
            {'appointment': 'apt20', 'patient': 'p6', 'doctor': 'dr1', 'rating': 4, 'comment': 'Very professional and caring. The treatment has been working great so far.'},
        ]

        for fb_data in feedback_data:
            apt_id = fb_data.pop('appointment')
            patient_id = fb_data.pop('patient')
            doctor_id = fb_data.pop('doctor')
            Feedback.objects.create(
                appointment=created_appointments[apt_id],
                patient=patients[patient_id],
                doctor=doctors[doctor_id],
                **fb_data
            )

        self.stdout.write(f'Created {len(feedback_data)} feedback entries')

        self.stdout.write('Creating symptoms...')
        # Symptoms
        Symptom.objects.create(
            patient=patients['p1'],
            symptom_description='Persistent headache with sensitivity to light',
            severity='Moderate',
            body_part='Head',
            duration='3 days'
        )

        self.stdout.write('Creating medical documents...')
        # Medical documents
        MedicalDocument.objects.create(
            patient=patients['p1'],
            document_name='Blood Test Results - Jan 2024',
            document_type='Lab Report',
            file_url='https://example.com/docs/blood-test.pdf',
            file_size=245678
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
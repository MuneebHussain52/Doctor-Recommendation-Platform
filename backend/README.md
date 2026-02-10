# Healthcare Dashboard Backend - Django + PostgreSQL

Backend API for the Healthcare Dashboard application built with Django REST Framework and PostgreSQL.

## Prerequisites

- Python 3.8 or higher
- PostgreSQL 14 or higher
- pip (Python package manager)

## Installation

### 1. Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up PostgreSQL Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE healthcare_db;"

# Or using psql shell:
psql -U postgres
CREATE DATABASE healthcare_db;
\q
```

### 4. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_NAME=healthcare_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5. Run Migrations

```bash
# Create database tables
python manage.py makemigrations
python manage.py migrate
```

### 6. Load Sample Data

```bash
# Seed the database with sample data
python manage.py seed_data
```

### 7. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

Server will start at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /api/health/` - Health check

### Doctor Dashboard

- `GET /api/doctors/` - List all doctors
- `GET /api/doctors/{doctorId}/` - Get doctor details
- `GET /api/doctors/{doctorId}/dashboard_stats/` - Get dashboard statistics
- `GET /api/doctors/{doctorId}/appointments/` - Get doctor's appointments
  - Query params: `?status=upcoming|completed|cancelled`
- `GET /api/doctors/{doctorId}/feedback/` - Get doctor's feedback/ratings
- `GET /api/doctors/{doctorId}/working_hours/` - Get working hours
- `PUT /api/doctors/{doctorId}/update_working_hours/` - Update working hours

### Patient Dashboard

- `GET /api/patients/` - List all patients
- `GET /api/patients/{patientId}/` - Get patient details
- `GET /api/patients/{patientId}/dashboard_stats/` - Get dashboard statistics
- `GET /api/patients/{patientId}/appointments/` - Get patient's appointments
  - Query params: `?status=upcoming|completed|cancelled`
- `GET /api/patients/{patientId}/documents/` - Get medical documents
- `POST /api/patients/{patientId}/upload_document/` - Upload medical document
- `GET /api/patients/{patientId}/symptoms/` - Get symptoms history
- `POST /api/patients/{patientId}/submit_symptom/` - Submit symptoms
- `PUT /api/patients/{patientId}/` - Update patient profile

### Appointments

- `GET /api/appointments/` - List all appointments
- `POST /api/appointments/` - Create new appointment
- `GET /api/appointments/{appointmentId}/` - Get appointment details
- `PUT /api/appointments/{appointmentId}/` - Update appointment
- `PATCH /api/appointments/{appointmentId}/update_status/` - Update appointment status
- `DELETE /api/appointments/{appointmentId}/` - Cancel appointment
- `GET /api/appointments/available-slots/{doctorId}/{date}/` - Get available time slots

### Feedback

- `GET /api/feedback/` - List all feedback
- `POST /api/feedback/` - Submit feedback
- `GET /api/feedback/{feedbackId}/` - Get feedback details
- `PUT /api/feedback/{feedbackId}/` - Update feedback
- `DELETE /api/feedback/{feedbackId}/` - Delete feedback
- `GET /api/feedback/doctor/{doctorId}/` - Get all feedback for a doctor
  - Query params: `?limit=10`
- `GET /api/feedback/patient/{patientId}/` - Get all feedback by a patient

## Admin Panel

Access Django admin at: `http://localhost:8000/admin/`

Login with the superuser credentials you created.

## Project Structure

```
backend/
├── healthcare_backend/      # Django project settings
│   ├── __init__.py
│   ├── settings.py         # Main settings
│   ├── urls.py             # Root URL configuration
│   ├── wsgi.py
│   └── asgi.py
├── api/                     # Main API app
│   ├── models.py           # Database models
│   ├── serializers.py      # REST serializers
│   ├── views.py            # API views
│   ├── urls.py             # API URL routes
│   ├── admin.py            # Admin configuration
│   └── management/
│       └── commands/
│           └── seed_data.py # Seed data command
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── README.md
```

## Database Models

### Tables:
- **doctors** - Doctor profiles and credentials
- **patients** - Patient profiles and medical information
- **working_hours** - Doctor availability schedules
- **appointments** - Appointment records
- **feedback** - Patient ratings and reviews
- **medical_documents** - Patient document storage
- **symptoms** - Patient symptom submissions

## Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:8000/api/health/

# Get doctor stats
curl http://localhost:8000/api/doctors/dr1/dashboard_stats/

# Get patient stats
curl http://localhost:8000/api/patients/p1/dashboard_stats/

# Get appointments
curl http://localhost:8000/api/doctors/dr1/appointments/
curl http://localhost:8000/api/patients/p1/appointments/

# Create appointment
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "p1",
    "doctor": "dr1",
    "appointment_date": "2024-02-01",
    "appointment_time": "10:00",
    "appointment_type": "Consultation",
    "reason": "General checkup"
  }'
```

### Using Django REST Framework Browsable API:

Visit `http://localhost:8000/api/` in your browser to access the interactive API browser.

## Common Commands

```bash
# Run development server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Seed database
python manage.py seed_data

# Create superuser
python manage.py createsuperuser

# Run Django shell
python manage.py shell

# Clear database and reseed
python manage.py flush
python manage.py seed_data
```

## Troubleshooting

### Issue: "No module named 'decouple'"
**Solution:** Install requirements
```bash
pip install -r requirements.txt
```

### Issue: "FATAL: password authentication failed"
**Solution:** Check your `.env` file has correct PostgreSQL password

### Issue: "FATAL: database does not exist"
**Solution:** Create the database
```bash
psql -U postgres -c "CREATE DATABASE healthcare_db;"
```

### Issue: "Table doesn't exist"
**Solution:** Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Issue: "Port already in use"
**Solution:** Run on different port
```bash
python manage.py runserver 8001
```

## Production Deployment

Before deploying to production:

1. ✅ Set `DEBUG=False` in `.env`
2. ✅ Generate strong `SECRET_KEY`
3. ✅ Configure `ALLOWED_HOSTS`
4. ✅ Set up PostgreSQL with SSL
5. ✅ Use environment variables for sensitive data
6. ✅ Enable HTTPS
7. ✅ Configure static files serving
8. ✅ Set up database backups
9. ✅ Use gunicorn or uwsgi
10. ✅ Configure nginx as reverse proxy

## Frontend Integration

Update frontend `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

The frontend should now connect to Django backend instead of Express.

## License

MIT
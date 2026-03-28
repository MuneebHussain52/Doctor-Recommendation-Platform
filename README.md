# 🏥 Doctor Recommendation Platform

> A full-stack web application that helps patients find the right doctor based on their symptoms and medical needs. Built as a Final Year Project integrating React, Django REST Framework, PostgreSQL, and a locally deployed AI recommendation model.

---

## 🚀 Live Demo
> Coming soon — deployment in progress

---

## ✨ Features

### 👤 Patient
- Register, login, and manage personal profile
- Get AI-powered doctor recommendations based on symptoms
- Browse and filter doctors by specialty
- Book, view, and manage appointments
- Request refunds for cancelled appointments

### 🩺 Doctor
- Dedicated dashboard to manage appointments
- View patient details and appointment history
- Mark appointments as completed
- Manage availability and specialty information

### 🔧 Admin
- Full control over doctors, patients, and appointments
- Manage doctor specialties and platform settings
- Monitor overall platform activity

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, TypeScript, Tailwind CSS |
| Backend | Django, Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Tokens) |
| AI Model | Python ML model trained on 4,000+ data points |
| Testing | Jest, Python unit tests |

---

## 📂 Project Structure

```
Doctor-Recommendation-Platform/
├── Frontend/          # React + TypeScript frontend
├── backend/           # Django REST Framework backend
├── ML Model/          # AI recommendation engine
├── Docs/              # Project documentation
│   ├── REFUND_POLICY.md
│   ├── SPECIALTY_SYSTEM.md
│   ├── COMPLETION_FLOW.md
│   └── TROUBLESHOOTING.md
├── Scripts/           # Utility scripts
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- Python 3.9+
- PostgreSQL

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file with your credentials (see .env.example)
cp .env.example .env

python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

### ML Model Setup
```bash
cd "ML Model"
pip install -r requirements.txt
python app.py
```

---

## 🤖 AI Recommendation Model

The platform includes a machine learning model trained on **4,000+ data points** that recommends the most suitable doctors based on patient-reported symptoms. The model runs locally and integrates with the Django backend via a dedicated REST API endpoint.

---

## 🔐 Security
- JWT authentication with protected API routes
- Role-based access control (Patient / Doctor / Admin)
- Input validation on all forms
- Password hashing
- CORS configuration

---

## 🧪 Testing

The project includes validation tests for:
- Email, password, and phone number validation
- Admin and patient form inputs
- API completion flow
- Appointment and refund workflows

---

## 📸 Screenshots
> Add screenshots of your dashboards here for maximum impact

---

## 👨‍💻 Author

**Muneeb Hussain Anjam**
- 📧 [muneeb525353@gmail.com](mailto:muneeb525353@gmail.com)
- 💼 [linkedin.com/in/mhussainn](https://linkedin.com/in/mhussainn)
- 🐙 [github.com/MuneebHussain52](https://github.com/MuneebHussain52)

---

## 📜 License

This project is open-source and built for educational purposes as a Final Year Project at **Bahria University, Islamabad**.

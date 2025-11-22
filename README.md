# UniPlus

> A comprehensive university event management platform for seamless event discovery, registration, and attendance tracking.

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)  
![Django](https://img.shields.io/badge/django-5.0-green.svg)  
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)  
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)  
![Docker](https://img.shields.io/badge/docker-24+-2496ED.svg)

**Built with:** Next.js · Django · PostgreSQL · Docker · Tailwind CSS

---

## 🎯 Overview

UniPlus is a production-ready event management system designed for university communities. It enables students to discover events, register with a single click, and receive digital QR-coded tickets. Organizers can create events, manage registrations, and track attendance efficiently.

### Key Features

**For Students:**
- 🔍 Browse and search university events with advanced filtering
- 📝 One-click event registration
- 🎟️ Digital tickets with unique QR codes
- 📱 Personal ticket dashboard with upcoming/past events
- ⭐ Event ratings and reviews
- 🔔 Real-time notifications for approvals and event updates

**For Organizers:**
- ✏️ Complete event creation with multi-day support
- 👥 Registration management with bulk approval/rejection
- 📊 Attendee dashboard with real-time statistics
- 📋 CSV export for attendance records
- 🔗 QR code check-in system for attendance verification
- 📧 Contact information and terms management

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  (React, TypeScript, Tailwind CSS, Framer Motion)       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ├─── HTTP/REST API
                   │
┌──────────────────▼──────────────────────────────────────┐
│                Backend (Django)                         │
│     (Django Ninja, PostgreSQL, JWT Authentication)      │
├─────────────────────────────────────────────────────────┤
│  • Event Management (CRUD)                              │
│  • Multi-day Event Scheduling                           │
│  • Registration & Ticket System                         │
│  • QR Code Generation & Verification                    │
│  • Notification System (Real-time)                      │
│  • User Management & Authentication                     │
│  • Rating & Comment System                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│          Database (PostgreSQL)                          │
│  (JSONB fields, Relational schema, Indexes)             │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

Before getting started, ensure you have the following installed:

- **Python** 3.11 or higher
- **Node.js** 18 or higher
- **Docker** & **Docker Compose**
- **PostgreSQL** 16 (or use Docker)
- **Git**

### Package Managers
- **pip** (Python package manager)
- **npm** (Node.js package manager)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/UniPlus.git
cd UniPlus
```

### 2. Docker Setup (Recommended)

The easiest way to run the entire stack:

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# Access the services:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# PgAdmin:   http://localhost:5050
```

### 3. Manual Setup (Alternative)

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv env

# Activate virtual environment
source env/bin/activate              # macOS/Linux
# OR
env\Scripts\activate                 # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

The backend will run on **`http://localhost:8000`**

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend/uniplus

# Install dependencies
npm install

# Install UI dependencies
npm install lucide-react framer-motion

# Start development server
npm run dev
```

The frontend will run on **`http://localhost:3000`**

---

## 🔐 Environment Variables

### Backend (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uniplus_db
DB_USER=postgres
DB_PASSWORD=your_password

# Django
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Optional: Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Database Credentials (Docker)

When using `docker-compose`, the default credentials are:

| Service | Credential | Value |
|---------|-----------|-------|
| PostgreSQL | Host | `db` |
| PostgreSQL | Port | `5432` |
| PostgreSQL | Database | `uniplus_db` |
| PostgreSQL | Username | `postgres` |
| PostgreSQL | Password | `Password` |
| PgAdmin | Email | `admin@admin.com` |
| PgAdmin | Password | `admin` |

---

## 📁 Project Structure

```
UniPlus/
├── backend/
│   ├── uniplus/
│   │   ├── settings.py           # Django configuration
│   │   ├── urls.py               # URL routing
│   │   └── wsgi.py
│   ├── api/
│   │   ├── models/               # Database models
│   │   │   ├── user.py
│   │   │   ├── event.py
│   │   │   ├── ticket.py
│   │   │   ├── event_schedule.py
│   │   │   ├── notification.py
│   │   │   ├── rating.py
│   │   │   └── comment.py
│   │   ├── api.py               # API endpoints (Django Ninja)
│   │   ├── schemas.py           # Request/Response schemas
│   │   └── admin.py             # Django admin config
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   └── uniplus/
│       ├── app/
│       │   ├── events/
│       │   │   ├── page.tsx       # Event listing
│       │   │   ├── [id]/
│       │   │   │   └── page.tsx   # Event detail
│       │   │   └── create/
│       │   │       └── page.tsx   # Event creation
│       │   ├── tickets/
│       │   │   └── page.tsx       # Ticket dashboard
│       │   ├── profile/
│       │   │   └── page.tsx       # User profile
│       │   └── layout.tsx
│       ├── components/
│       │   ├── EventCard.tsx      # Event card component
│       │   ├── EventSchedule.tsx  # Multi-day schedule
│       │   ├── TagSelector.tsx    # Tag selection
│       │   └── ...
│       ├── styles/
│       │   └── globals.css
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Development Workflow

### Running Both Services Simultaneously

**Terminal 1 (Frontend):**
```bash
cd frontend/uniplus
npm run dev
```

**Terminal 2 (Backend) Using Docker Compose (Simpler):**

---

## 📊 Key Features in Detail

### Multi-Day Event Support
Events can span multiple days with individual QR codes and check-in tracking per day.

### Smart Notification System
notifications for:
- Event registration approvals/rejections
- New event creation (admins)

### Approval Workflow
- Students register → Pending status
- Organizer reviews and approves/rejects
- attendees can check in with QR code

### Rating & Review System
Attendees can rate events (1-5 stars) and leave detailed reviews after events conclude.

### Organizer Dashboard
Real-time attendee tracking with:
- Registration statistics
- Approval status breakdown
- Per-day attendance tracking
- CSV export for records

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>

# Find and kill process using port 8000 (backend)
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost

# Reset database (Docker)
docker-compose down -v
docker-compose up --build
```

### Frontend Not Connecting to Backend

Ensure:
- Backend is running on `http://localhost:8000`
- CORS is enabled in Django settings
- API endpoint URLs in frontend match backend

### Docker Issues

```bash
# Clear Docker cache
docker-compose down
docker system prune -a
docker-compose up --build
```

---

## 📝 Development Notes

### Code Style
- **Backend:** PEP 8 (Python)
- **Frontend:** ESLint + Prettier
- Commit messages: Follow conventional commits

### Git Workflow
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push to branch: `git push origin feature/feature-name`
4. Create Pull Request

### Database Migrations

```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# View migration status
python manage.py showmigrations
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) - see the LICENSE file for details.

---

## 👨‍💻 Developers

- Nunthapop Nganiam
- Peerapat Seenoi 
- Riccardo M. Bonato
- Sudha Sutaschuto

---

### Version [1.0]
- ✨ Multi-day event support
- 🔔 Real-time notifications
- 📊 Organizer dashboard
- ⭐ Rating system
- 🎟️ QR code check-in
---

**Last Updated:** [23/11/25]  

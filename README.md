# UniPlus

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)  
![Django](https://img.shields.io/badge/django-5.0-green.svg)  
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)  
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)

Next.js · Django · PostgreSQL · Docker  

---

## 📋 Prerequisites

- **Python 3.11+**  
- **Node.js**  
- **PostgreSQL** (running locally or via Docker)  
- **pip** and **npm** package managers  

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/UniPlus/UniPlus.git
cd UniPlus
```

### 2. Backend Setup (Django)

```bash
#docker for everything
start docker-desktop
docker-compose up --build

# Create and activate virtual environment
python -m venv env
source env/bin/activate      # macOS/Linux
env\Scripts\activate         # Windows

# Install dependencies(manual install if you have issue with docker compose)
cd backend
pip install -r .\requirements.txt
```

### 3. Frontend Setup (Next.js)

```bash
cd frontend/uniplus

# Install dependencies
npm install

# Install lucide react icon library
npm install lucide-react
npm install framer-motion

# Run development server
npm run dev
```

The frontend will run locally on **[http://localhost:3000](http://localhost:3000)**

The backend will run locally on **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

the database will run locally on **[http://localhost:5050](http://127.0.0.1:8000)**

---

## 🔐 Database Credentials

The passwords for the database will be these:

- PGADMIN_DEFAULT_EMAIL: admin@admin.com
- PGADMIN_DEFAULT_PASSWORD: admin
- DB_HOST=db
- DB_PORT=5432
- DB_NAME=uniplus_db
- DB_USER=postgres
- DB_PASSWORD=Password

---

## ▶️ Run the Project

You will need **two terminals**:

**Terminal 1 (Backend)**

```bash
(if composed already)
docker-compose down
docker-compose up --build

(if not composed already)
docker-compose up --build
```

**Terminal 2 (Frontend)**

```bash
cd frontend/uniplus

npm run dev
```

---
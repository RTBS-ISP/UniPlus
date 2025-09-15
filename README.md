# UniPLUS  

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)  
![Django](https://img.shields.io/badge/django-5.0-green.svg)  
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)  
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)  

Next.js · Django · MySQL · Docker  


---

## 📝 Overview
UniPLUS is a centralized web platform that helps students and organizers manage university events.  

- **Students**: browse, register, and track events.  
- **Organizers**: create/manage events, check attendance with QR codes, collect feedback.  
- **Admins**: approve or deny events for quality control.  

---

## 🗂️ Documents

You can find all project documentation in our [GitHub Wiki](https://github.com/RTBS-ISP/UniPlus/wiki).

---

## ⚙️ Installation Guide

### Prerequisites
- **Python 3.11+**  
- **Node.js**  
- **MySQL** (running locally or via Docker)  
- **pip** and **npm** package managers  

---

### 1. Clone the Repository
```bash
git clone https://github.com/RTBS-ISP/UniPlus.git
cd UniPlus
````

---

### 2. Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv env
source env/bin/activate      # macOS/Linux
env\Scripts\activate         # Windows

# Install dependencies
pip install django django-ninja django-cors-headers

# Enter backend folder
cd backend

# Run server
python manage.py runserver
```

---

### 3. Frontend Setup (Next.js)

```bash
cd frontend
cd uniplus

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will run locally on **[http://localhost:3000](http://localhost:3000)**
The backend will run locally on **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## ▶️ Run the Project

You will need **two terminals**:

**Terminal 1 (Backend)**

```bash
cd backend
python manage.py runserver
```

**Terminal 2 (Frontend)**

```bash
cd frontend/uniplus
npm run dev
```

---
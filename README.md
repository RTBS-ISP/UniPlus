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

# n8n Workflow Setup Guide

This guide explains how to set up and run the **Gemini API** workflow in **n8n**.

---

## Step 1 — Generate Gemini API Key

Go to [AI Studio API Keys](https://aistudio.google.com/api-keys) and generate or copy your API key.

<img width="2877" height="1747" alt="n8n1" src="https://github.com/user-attachments/assets/70aeb0a5-0f43-4419-86d3-253d88519813" />

---

## Step 2 — Open n8n

Sign up or log in at: [http://localhost:5678/](http://localhost:5678/)


<img width="2877" height="1675" alt="n8n2" src="https://github.com/user-attachments/assets/7d64ac45-d8cd-41d4-9e57-79e45bc82174" />

---

## Step 3 — Import the Workflow

1. Click the **… (three dots)** button in the top-right corner.  
2. Select **Import File**.  
3. Choose `workflow.json` from the repository.

<img width="2879" height="1742" alt="b8b3" src="https://github.com/user-attachments/assets/7cb94606-59d1-41c3-bedb-ddc6597b564a" />

<img width="2879" height="1740" alt="n8n4" src="https://github.com/user-attachments/assets/ba128b95-13f6-456d-ad08-08245d05c7c3" />

---

## Step 4 — Configure Gemini Credentials

1. Double-click the **Gemini** node in the workflow.  
2. Under **Credential to connect with**, click the dropdown.
3. Click **Create New Credential**.  
4. Paste the API key from Step 1.  
5. Click **Save**.

<img width="2879" height="1652" alt="n8n5" src="https://github.com/user-attachments/assets/7d6e61ab-cf5b-4cb1-b13b-e00643419ec9" />

<img width="1799" height="1131" alt="n8n6" src="https://github.com/user-attachments/assets/943bd0e3-04f7-4b9e-b92a-27007c817631" />

---

## Step 6 — Activate the Workflow

Click **Activate** in the top-right corner to start the workflow.

<img width="2879" height="1742" alt="b8b3" src="https://github.com/user-attachments/assets/7cb94606-59d1-41c3-bedb-ddc6597b564a" />


---

## Notes

- Make sure your **n8n server** is running locally at `http://localhost:5678/`.  
- Your workflow will only run after activating it and connecting the credentials.

---



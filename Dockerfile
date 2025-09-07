# Dockerfile
FROM python:3.11-slim

# set working directory
WORKDIR /app

# install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy project files
COPY . .

# run Django on container start
CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]
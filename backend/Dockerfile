# Use an official lightweight Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /backend

# Copy only requirements.txt first (for better caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Now copy everything else (including app.py, models, etc.)
COPY . .

# Expose FastAPI's port
EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]

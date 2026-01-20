FROM python:3.8-slim
WORKDIR /app

# Install system dependencies including lxml build dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1-mesa-glx \
    # Add these for lxml
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    # Add build tools for compiling
    gcc \
    g++ \
    make \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python packages with increased timeout
RUN pip install --upgrade pip && \
    pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Copy the rest of the application INCLUDING models
COPY . .

EXPOSE 5000
CMD ["python", "docker_ocr.py"]
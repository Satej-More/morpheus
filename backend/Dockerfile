# Morpheus Backend — Python + Node.js (for Dynatrace MCP server via npx)
FROM python:3.12-slim

WORKDIR /app

# Install Node.js 20 (required to run Dynatrace MCP server via npx)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-cache the Dynatrace MCP server npm package
RUN npx --yes @dynatrace-oss/dynatrace-mcp-server@latest --version 2>/dev/null || true

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

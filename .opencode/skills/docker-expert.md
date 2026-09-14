# Docker Expert Skill

## Purpose
Assist with Docker containerization, Docker Compose, and deployment configurations.

## When to Use
- When creating or modifying Dockerfiles
- When configuring docker-compose.yml
- When troubleshooting container issues
- When optimizing image builds

## Instructions

1. **Dockerfile Best Practices**:
   - Use multi-stage builds for smaller images
   - Minimize layers by combining RUN commands
   - Use specific base image tags (not :latest)
   - Add .dockerignore to exclude unnecessary files
   - Run as non-root user when possible

2. **Docker Compose Guidelines**:
   - Use named volumes for persistent data
   - Configure proper health checks
   - Set restart policies appropriately
   - Use environment variables for configuration
   - Define networks for service isolation

3. **Security Considerations**:
   - Never hardcode credentials in images
   - Use Docker secrets or environment variables
   - Scan images for vulnerabilities
   - Keep base images updated
   - Use read-only file systems where possible

4. **Optimization Tips**:
   - Order Dockerfile commands by change frequency
   - Use BuildKit for faster builds
   - Leverage layer caching
   - Minimize image size with alpine variants
   - Use multi-stage builds for compiled languages

## Common Patterns

### Node.js Frontend
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

### Python Backend
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

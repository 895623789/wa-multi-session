# Use Node.js 20 base image
FROM node:20-slim

# Install system dependencies for Baileys/WhatsApp if needed
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the project (TypeScript to JavaScript)
RUN npm run build

# Expose the API port
EXPOSE 5000

# Start the server using the compiled JS
CMD ["node", "dist/server.js"]

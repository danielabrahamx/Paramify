FROM node:20-bullseye
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --only=production || npm install

# Copy source (context is already /app with backend/ as build context)
COPY . ./

# Env and port
ENV PORT=3001
EXPOSE 3001

# Start backend
CMD ["node","server.js"]

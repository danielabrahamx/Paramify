FROM node:20-bullseye
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install || true

# Copy source (context is already /app with frontend/ as build context)
COPY . ./

# Expose Vite dev server
EXPOSE 5173

# Start Vite with host binding so browser can reach it from host
CMD ["npm","run","dev","--","--host","0.0.0.0"]

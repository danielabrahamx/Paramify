# Multi-stage Dockerfile for Paramify ICP Development
FROM ubuntu:22.04 as base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV DFX_VERSION=0.16.1
ENV NODE_VERSION=18
ENV RUST_VERSION=stable

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    pkg-config \
    python3 \
    python3-pip \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Add wasm target for Rust
RUN rustup target add wasm32-unknown-unknown

# Install cargo dependencies for ICP development
RUN cargo install ic-wasm

# Install DFX
RUN sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)" \
    && echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc

# Set working directory
WORKDIR /app

# Development stage
FROM base as development

# Install additional development tools
RUN npm install -g \
    prettier \
    eslint \
    typescript \
    @types/node

# Create a non-root user for development
RUN useradd -m -s /bin/bash developer \
    && echo 'developer ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci
RUN cd frontend && npm ci

# Copy the rest of the application
COPY . .

# Set ownership to developer user
RUN chown -R developer:developer /app

# Switch to developer user
USER developer

# Set PATH for developer user
ENV PATH="/home/developer/bin:${PATH}"
ENV PATH="/home/developer/.cargo/bin:${PATH}"

# Expose ports
EXPOSE 4943 3000 8080

# Default command for development
CMD ["bash"]

# Production build stage
FROM base as builder

# Copy application files
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm ci
RUN cd frontend && npm ci

# Build canisters
RUN /root/bin/dfx build --network local

# Build frontend
RUN cd frontend && npm run build

# Production runtime stage
FROM ubuntu:22.04 as production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install DFX (runtime only)
ENV DFX_VERSION=0.16.1
RUN sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
ENV PATH="/root/bin:${PATH}"

# Copy built artifacts from builder
COPY --from=builder /app/.dfx /app/.dfx
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY --from=builder /app/canister_ids.json /app/canister_ids.json
COPY --from=builder /app/dfx.json /app/dfx.json

WORKDIR /app

# Expose replica port
EXPOSE 4943

# Start local replica
CMD ["dfx", "start", "--host", "0.0.0.0:4943"]
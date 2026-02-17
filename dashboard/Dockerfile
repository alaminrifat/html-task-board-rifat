# Use an official Node.js runtime as a parent image (slim instead of alpine to avoid musl issues)
FROM node:20-slim AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies (regenerate lock file if needed)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code to the working directory
COPY . .

# Build the React application for production
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install pm2 globally
RUN npm install -g pm2

# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]

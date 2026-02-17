# Use an official Node.js runtime as a parent image
FROM node:20-slim AS builder

# Set the working directory in the container
WORKDIR /app

# Copy only package.json (NOT package-lock.json to avoid npm optional deps bug)
COPY package.json ./

# Fresh install without lock file to get correct platform binaries
RUN npm install --legacy-peer-deps

# Copy the rest of the application code to the working directory
COPY . .

# Remove any copied lock file and reinstall if needed
RUN rm -f package-lock.json

# Build the React application for production
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install pm2 globally
RUN npm install -g pm2

# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]

# Use an official Node.js runtime as a parent image
FROM node:23-alpine
EXPOSE 3001
# Set environment variables for Node.js
# ENV NODE_ENV development

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install pm2 -g

# Install dependencies
RUN npm install

COPY . .

RUN npm run build

# RUN npm run migrate:latest

# CMD ["pm2-runtime", "ecosystem.config.js"]

RUN chmod +x entrypoint.sh

# Set the entrypoint script as the default command to execute when the container starts
ENTRYPOINT ["sh", "entrypoint.sh"]
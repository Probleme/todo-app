FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema before generating client
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Fix permissions for nest CLI
RUN chmod +x ./node_modules/.bin/nest

# Expose port
EXPOSE 3000

# Command to run in development mode
CMD ["npm", "run", "start:dev"]
# Use Node base image
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package.json & lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port 80 for Vite dev server
EXPOSE 80

# Run Vite dev server on 0.0.0.0:80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]

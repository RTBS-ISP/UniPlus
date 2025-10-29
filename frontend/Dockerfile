FROM node:18-alpine

WORKDIR /uniplus

# Copy package files from uniplus subfolder
COPY uniplus/package*.json ./

# Install dependencies
RUN npm install
# Copy the rest of the uniplus project files
COPY uniplus/ ./
# Expose port 3000
EXPOSE 3000
# Start the development server
CMD ["npm", "run", "dev"]
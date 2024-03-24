# Use a base image suitable for your backend application (e.g., Node.js)
FROM node:20.11.1

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your backend application runs on
EXPOSE 7000

# Command to run your backend application
CMD ["npm","run","start"]
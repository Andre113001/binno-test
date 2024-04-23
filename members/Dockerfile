# Stage 1: Build dependencies
FROM node:14 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

# Rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source

# Stage 2: Create final image
FROM node:14

WORKDIR /app

COPY --from=builder /app .

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3200

# Define the command to run your app
CMD ["npm", "start"]

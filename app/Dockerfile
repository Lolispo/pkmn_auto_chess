# Use the official Node.js 16 image.
# Check for the exact tag you want to use at https://hub.docker.com/_/node
FROM node:16

# Create app directory (this is where your application code will live)
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD ["npm", "run", "start"]

FROM node:16

# Create app directory (this is where your application code will live)
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install
# Relies on some dependencies from backend still

COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD ["npm", "run", "start", ">", "output.out"]
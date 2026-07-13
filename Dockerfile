# blog-backend/Dockerfile

FROM node:20-alpine

WORKDIR /app

ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}


# copy package files first for better caching
COPY package*.json ./
COPY .npmrc ./

# install dependencies
RUN npm ci

# copy source code
COPY . .

# build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
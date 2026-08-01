# blog-backend/Dockerfile

FROM node:24-alpine

WORKDIR /app

ARG NPM_TOKEN


# copy package files first for better caching
COPY package*.json ./

# create .npmrc dynamically using the build arg
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > .npmrc && \
    echo "@narekshabandari:registry=https://npm.pkg.github.com" >> .npmrc

# install dependencies
RUN npm ci

# remove .npmrc so token is not in the image
RUN rm -f .npmrc

# copy source code
COPY . .

# build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
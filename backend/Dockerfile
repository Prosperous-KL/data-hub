FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY ecosystem.config.js ./ecosystem.config.js

EXPOSE 4000

CMD ["npm", "start"]

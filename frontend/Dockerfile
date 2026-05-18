FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Añadimos soporte para hot-reload
ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "dev"]

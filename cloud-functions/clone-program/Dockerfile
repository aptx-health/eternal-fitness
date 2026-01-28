FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --production
RUN npx prisma generate
COPY . .
RUN npm run build
CMD ["npm", "start"]

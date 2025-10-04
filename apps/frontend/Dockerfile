
FROM node:24 
WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install

EXPOSE 8000

CMD ["pnpm", "--filter", "@solmessage/frontend", "dev"]

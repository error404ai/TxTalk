
FROM node:24 
WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install

EXPOSE 5173

CMD ["pnpm", "--filter", "@txtalk/frontend", "dev"]

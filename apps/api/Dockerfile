
FROM node:24 
WORKDIR /app

RUN npm install -g pnpm
RUN pnpm install

EXPOSE 8000

CMD ["pnpm", "--filter", "@solmessage/api", "dev"]

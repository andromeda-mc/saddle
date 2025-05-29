FROM node:current-alpine
WORKDIR /usr/local/saddle

ARG PORT=3000

COPY . .

RUN rm -rf node_modules package-lock.json
RUN npm cache clean --force
RUN npm i

RUN npm run build

EXPOSE ${PORT}

CMD ["node", "build/index.js"]
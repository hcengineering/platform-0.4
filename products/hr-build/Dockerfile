FROM node:14-alpine

EXPOSE 8080 18080

WORKDIR /app
COPY dist .
COPY launcher.sh .

CMD [ "sh", "launcher.sh" ]
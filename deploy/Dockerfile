FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG BUILD_SCRIPT=build

RUN npm run ${BUILD_SCRIPT} \
    && if [ "${BUILD_SCRIPT}" = "build:entry" ]; then \
      test -f dist/site/portals/appointments/0.1.0-demo/entry.js \
      && test -f dist/site/portals/appointments/0.1.0-demo/entry.css; \
    fi \
    && mkdir -p /app/site \
    && if [ -d dist/dlc-appointments-portal/browser ]; then cp -R dist/dlc-appointments-portal/browser/. /app/site/; fi \
    && if [ -d dist/site ]; then cp -R dist/site/. /app/site/; fi


FROM nginx:1.27-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/site /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

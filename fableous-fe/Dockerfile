FROM node:lts-alpine as builder
WORKDIR /build
COPY fableous-fe fableous-fe
COPY proto proto
COPY Makefile .
RUN make
WORKDIR /build/fableous-fe
RUN yarn install
RUN yarn build --mode production

FROM nginx:stable-alpine as production
COPY --from=builder /build/fableous-fe/build /usr/share/nginx/html
COPY --from=builder /build/fableous-fe/nginx.conf /etc/nginx/conf.d
RUN rm /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

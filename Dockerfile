FROM node:12.9.0-alpine as builder
WORKDIR '/app'
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --base-href /epilexo/
FROM nginx
EXPOSE 80
COPY nginx.conf /etc/nginx/nginx.conf 
COPY --from=builder /app/dist/epilexo /usr/share/nginx/html/epilexo


# Build stage
FROM oven/bun AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb (if used) first to leverage Docker's layer caching
COPY package.json .
COPY bun.lock .

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of your project files
COPY . .

# Pass build arguments
# ARG VITE_API_URL
# ARG VITE_WS_URL
# ENV VITE_API_URL=$VITE_API_URL
# ENV VITE_WS_URL=$VITE_WS_URL

RUN bun run build

# Serve stage
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

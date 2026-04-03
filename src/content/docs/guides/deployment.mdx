---
title: Deployment
description: Deploy your application to production.
order: 1
---

## Build for Production

Create an optimized production build:

```bash
npm run build
```

This generates a `dist/` directory with all static files ready for deployment.

## Deployment Options

### Vercel

The easiest way to deploy is with Vercel:

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel automatically detects the framework and deploys

### Netlify

Deploy to Netlify with a simple configuration:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

### Docker

Create a `Dockerfile` for containerized deployments:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

Build and run:

```bash
docker build -t my-app .
docker run -p 8080:80 my-app
```

:::note
Make sure to set environment variables in your deployment platform rather than committing `.env` files to your repository.
:::

## CI/CD

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Check that search is working
- [ ] Test dark mode toggle
- [ ] Validate mobile responsiveness
- [ ] Review performance metrics

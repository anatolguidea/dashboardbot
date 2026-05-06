# LeadTrack Deployment Guide (MySQL Production)

This guide explains how to deploy the LeadTrack Dashboard on your server using MySQL.

## 1. Prerequisites
- **MySQL Server** installed and running.
- **Node.js 20+** or **Docker**.

## 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
# For Docker: mysql://admin:admin_password@db:3306/dashboard
# For Local Server: mysql://USER:PASSWORD@localhost:3306/YOUR_DATABASE_NAME
DATABASE_URL="mysql://admin:admin_password@localhost:33061/dashboard"

# Auth
NEXTAUTH_SECRET="REPLACE_WITH_A_LONG_RANDOM_STRING"
NEXTAUTH_URL="http://your-server-ip:3000"
```

## 3. Database Preparation
1. Log into your MySQL server:
   ```sql
   CREATE DATABASE dashboard;
   ```
2. The application will handle the rest of the table creation automatically.

## 4. Deployment Steps

### Option A: Using Docker (Recommended)
```bash
docker-compose up -d --build
```

### Option B: Native Deployment
```bash
npm install
npx prisma db push
node prisma/seed.mjs
npm run build
npm run start
```

## 5. Initial Access
- **Email:** (The one you set in prisma/seed.mjs)
- **Password:** (The one you set in prisma/seed.mjs)

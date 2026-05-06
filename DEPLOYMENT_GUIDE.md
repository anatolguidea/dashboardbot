# LeadTrack Deployment Guide (MySQL Production)

This guide explains how to deploy the LeadTrack Dashboard and configure the multi-database architecture.

## 1. Prerequisites
- **MySQL Server** installed and running.
- **Node.js 20+** or **Docker**.
- **Admin Access** to the MySQL server to grant cross-database privileges.

## 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
# Use a user that has privileges across multiple databases on the same server
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/dashboard"

# Auth
NEXTAUTH_SECRET="REPLACE_WITH_A_LONG_RANDOM_STRING"
NEXTAUTH_URL="https://your-domain.com"
```

## 3. Database & Permissions (CRITICAL)

### 3.1 Main Application Database
1. Create the primary database for the application:
   ```sql
   CREATE DATABASE dashboard;
   ```
2. The application handles table creation via Prisma.

### 3.2 Cross-Database Permissions
Since the dashboard queries client-specific databases (e.g., `digix_db`) from the same MySQL server, your MySQL user **must** have permission to read from them.

Run this for every client database you add:
```sql
GRANT SELECT ON `client_db_name`.* TO 'your_mysql_user'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Client Database Requirements
For a client's database to be compatible with the dashboard, it **must** contain a table named `daily_stats` with the following columns:

| Column | Type | Description |
| :--- | :--- | :--- |
| `stat_date` | DATE | The date of the record |
| `source` | VARCHAR | Platform name (e.g., 'Facebook', 'Site') |
| `total` | INT | Total leads |
| `msg2` | INT | Leads with 2+ messages |
| `phone` | INT | Leads with phone numbers |
| `conv` | DECIMAL | Conversion rate % |
| `errors` | INT | Detected errors (optional) |

## 5. Deployment Steps

### Option A: Using Docker (Recommended)
```bash
# Start everything
docker-compose up -d --build

# Sync schema and create admin user
docker-compose exec app npx prisma db push
docker-compose exec app node prisma/seed.mjs
```

### Option B: Native Deployment
```bash
npm install
npx prisma db push
node prisma/seed.mjs
npm run build
npm run start
```

## 6. Post-Deployment Configuration
1. Log in to the Admin Panel (`/admin`).
2. Create/Edit a User.
3. In the **"Bază de date MySQL"** field, enter the exact name of the client's database (e.g., `digix_db`).
4. The dashboard will automatically detect the platforms (Facebook, Site, etc.) by scanning the `source` column in that database.

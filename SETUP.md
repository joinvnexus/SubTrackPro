# Setup Guide

This guide provides detailed instructions to set up and run the SubTrackPro application locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone the Repository](#clone-the-repository)
- [Install Dependencies](#install-dependencies)
- [Environment Setup](#environment-setup)
- [Stripe Test Mode Setup](#stripe-test-mode-setup)
- [Database Setup](#database-setup)
- [Run the Application](#run-the-application)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS version recommended |
| npm | 9+ | Comes with Node.js |
| PostgreSQL | 14+ | Local or cloud database |

---

## Clone the Repository

Open your terminal and run the following commands:

```
bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd SubTrackPro
```

---

## Install Dependencies

Install all required npm packages:

```
bash
npm install
```

This will install:
- All backend dependencies (Express, Drizzle, Passport, etc.)
- All frontend dependencies (React, Radix UI, Recharts, etc.)
- All dev dependencies (TypeScript, Vite, Tailwind, etc.)

---

## Environment Setup

### 1. Create Environment File

Copy the example environment file:

```
bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file and add your configuration:

```
env
# Required - Database connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/subtrackpro

# Required - Session secret for authentication
# Use a long random string in production
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Optional - Server port (default: 5000)
PORT=5000

# Optional - Node environment
NODE_ENV=development
```

### Database Connection Examples

**Local PostgreSQL:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/subtrackpro
```

**Neon (Cloud PostgreSQL):**
```
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/subtrackpro?sslmode=require
```

**Supabase (Cloud PostgreSQL):**
```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

---

## Stripe Test Mode Setup

Use this section to validate the `In Progress` Stripe flow end-to-end in test mode.

### Required Variables

Add these to `.env` (see `.env.example`):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Webhook Forwarding (Stripe CLI)

Run this in a separate terminal after starting the app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the generated webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Quick Validation Checklist

1. Log in and open `/dashboard/settings`.
2. Click `Upgrade to Pro` and complete checkout with a Stripe test card (for example: `4242 4242 4242 4242`).
3. Confirm webhook events are received in Stripe CLI output.
4. Verify `user_plans` is updated (`plan=pro`, active status, Stripe IDs set).
5. Click `Manage Billing` and confirm Stripe Billing Portal opens.

---

## Database Setup

### Option 1: Push Schema (Recommended for Development)

This creates all tables in your database:

```
bash
npm run db:push
```

### Option 2: Generate Migrations

If you need more control:

```
bash
# Generate migration files
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit migrate
```

---

## Run the Application

### Development Mode

Start the development server with hot reload:

```
bash
npm run dev
```

The application will be available at: **http://localhost:5000**

### Production Build

Build and run in production mode:

```
bash
# Build the application
npm run build

# Start production server
npm start
```

---

## Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run check` | TypeScript type checking |

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

**Solution:** Make sure your `.env` file has the correct `DATABASE_URL` and the PostgreSQL server is running.

#### 2. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change the port in `.env`:
```
env
PORT=5001
```

#### 3. Module Not Found Errors

**Solution:** Clear node_modules and reinstall:
```
bash
rm -rf node_modules
npm install
```

#### 4. TypeScript Errors

**Solution:** Run type check:
```
bash
npm run check
```

#### 5. Database Tables Not Created

**Solution:** Run db:push again:
```
bash
npm run db:push
```

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Ensure all prerequisites are installed
3. Verify your `.env` configuration
4. Check the console for error messages

---

## Next Steps

After setup, you can:

- [ ] Create your account at http://localhost:5000
- [ ] Add your first subscription
- [ ] Explore the dashboard analytics
- [ ] Check out the API at http://localhost:5000/api

---

For more information, see the [README.md](./README.md)

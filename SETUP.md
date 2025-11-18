# Finance Tracker Setup Guide

This guide will help you set up and run the Finance Tracker application locally.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** or **yarn**

## Database Setup

### 1. Install PostgreSQL

If you haven't already, install PostgreSQL:
- **macOS**: `brew install postgresql@14`
- **Ubuntu/Debian**: `sudo apt-get install postgresql-14`
- **Windows**: Download from https://www.postgresql.org/download/windows/

### 2. Start PostgreSQL

```bash
# macOS (Homebrew)
brew services start postgresql@14

# Ubuntu/Debian
sudo service postgresql start

# Windows - PostgreSQL runs as a service automatically
```

### 3. Create Database

```bash
# Log into PostgreSQL
psql postgres

# Create database (in psql prompt)
CREATE DATABASE finance_tracker;

# Create user (optional - or use your existing postgres user)
CREATE USER financeuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE finance_tracker TO financeuser;

# Exit psql
\q
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The `.env` file is already created. Update it with your PostgreSQL credentials:

```bash
# Edit backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres          # or your postgres username
DB_PASSWORD=postgres      # your postgres password

# Generate a secure JWT secret (or keep the default for development)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Initialize Database

```bash
# Sync database models (creates tables)
npm run dev
# The server will create tables automatically in development mode

# Alternative: Stop the server (Ctrl+C) and run the seeder to create demo user
npm run seed
```

### 5. Start Backend Server

```bash
npm run dev
```

The backend should now be running on `http://localhost:3000`

You should see:
```
✓ Database connection established successfully
✓ Database models synchronized
✓ Server running on http://localhost:3000
✓ Environment: development
```

## Frontend Setup

### 1. Open New Terminal and Navigate to Frontend

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Accessing the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Login with demo credentials:
   - **Email**: demo@example.com
   - **Password**: demo123

## Troubleshooting

### Database Connection Issues

If you see "Unable to connect to database":

1. **Check PostgreSQL is running**:
   ```bash
   # macOS
   brew services list

   # Ubuntu/Debian
   sudo service postgresql status
   ```

2. **Verify database exists**:
   ```bash
   psql postgres -c "\l"
   ```

3. **Check credentials in backend/.env match your PostgreSQL setup**

### Port Already in Use

If port 3000 or 5173 is already in use:

**Backend (port 3000)**:
- Edit `backend/.env` and change `PORT=3000` to another port
- Update `frontend/.env` to match: `VITE_API_URL=http://localhost:YOUR_NEW_PORT/api`

**Frontend (port 5173)**:
- Vite will automatically try the next available port
- Or specify manually in `frontend/vite.config.js`

### Module Not Found Errors

If you see "Cannot find module" errors:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Running Both Servers

You'll need two terminal windows:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### Database Migrations (Future)

When database schema changes are made:

```bash
cd backend
npm run migrate
```

To undo last migration:
```bash
npm run migrate:undo
```

## Next Steps

Now that the application is running, you can:

1. Explore the dashboard at `http://localhost:5173`
2. Navigate through different sections (Transactions, Invoices, etc.)
3. Start building out the features (most are placeholders currently)

## Current Status

The application currently has:
- ✅ Authentication system (login/logout)
- ✅ Database schema for double-entry accounting
- ✅ Basic CRUD for accounts, vendors, customers
- ✅ Frontend routing and navigation
- ⏳ Transaction management (placeholder)
- ⏳ AP/AR functionality (placeholder)
- ⏳ Reports and forecasting (placeholder)

## Need Help?

Check the main README.md for architecture details and feature roadmap.

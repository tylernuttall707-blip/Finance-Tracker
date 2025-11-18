# Finance Tracker - QuickBooks Alternative

A comprehensive financial management system for businesses, featuring double-entry accounting, invoice management, accounts payable/receivable, and cash flow forecasting.

## Features

- **Transaction Management**: Import and categorize bank and credit card transactions from CSV
- **Double-Entry Accounting**: Full chart of accounts with journal entries
- **Accounts Payable (AP)**: Track bills, vendors, and payment due dates
- **Accounts Receivable (AR)**: Manage invoices, customers, and incoming payments
- **Credit Card Tracking**: Monitor balances, due dates, and utilization
- **Financial Reports**:
  - Profit & Loss (P&L) Statement
  - Balance Sheet
  - Cash Flow Statement
- **Cash Flow Forecasting**: Predict future cash position based on known expenses, AP/AR, and estimated income
- **Multi-User Support**: Basic authentication for team collaboration

## Tech Stack

### Frontend
- React 18
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)
- Recharts (data visualization)

### Backend
- Node.js + Express
- PostgreSQL (database)
- Sequelize (ORM)
- JWT (authentication)

## Project Structure

```
Finance-Tracker/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── backend/           # Express API server
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── server.js
│   ├── migrations/
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Finance-Tracker
```

2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run migrate
npm run dev
```

3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

4. Access the application at `http://localhost:5173`

## Development

### Backend API
- Runs on `http://localhost:3000`
- API documentation available at `/api/docs`

### Frontend
- Runs on `http://localhost:5173`
- Hot module replacement enabled

### Database Migrations
```bash
cd backend
npm run migrate       # Run migrations
npm run migrate:undo  # Rollback migration
```

## Roadmap

- [x] Phase 1: Foundation & Authentication
- [ ] Phase 2: Core Accounting & Transaction Management
- [ ] Phase 3: AP/AR & Invoicing
- [ ] Phase 4: Credit Card Management
- [ ] Phase 5: Reporting & Forecasting
- [ ] Phase 6: Plaid Integration (future)

## License

MIT

## Contributing

See AGENTS.md for development guidelines.

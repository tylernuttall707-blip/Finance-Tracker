# Finance & Credit Card Tracker

This application helps you stay on top of your finances by:

- Tracking income and expenses across accounts
- Monitoring credit card balances and payments
- Visualizing spending trends to maintain a budget

## Installation

```bash
npm install
```

## Running the App

Use the Node.js helper script:

```bash
npm start
```

or open `index.html` directly in your browser for a static preview.

## Tests

```bash
npm test
```

## Configuration

Widgets and dashboard panels can be customized through the in-app settings.
Options include size (1–3 columns), height mode (auto, short, medium, tall, or fixed pixels),
chart type, color palette, and more. A sample widget configuration object:

```javascript
{
  chartType: 'bar',
  color: '#3b82f6',
  size: 2
}
```

### Data Storage

All preferences and financial data are stored in the browser's `localStorage`
under the key `cc-finance-tracker-v27`. Clearing your browser data will reset the app.

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bug fix.
2. Install dependencies and ensure tests pass.
3. Submit a pull request with a clear description of your changes.

## Quick Preview

A GitHub Pages deployment is available for an immediate preview:

[Finance Tracker Demo](https://example.github.io/finance-tracker/)

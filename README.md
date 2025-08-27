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

To build a production bundle (useful for GitHub Pages deployments), run:

```bash
npm run build
```

The compiled assets will be output to the `dist/` folder.

## Tests

```bash
npm test
```

## Configuration

Widgets and dashboard panels can be customized through the in-app settings.
Dashboard column counts are adjustable in Customize mode via a slider (1–6 columns per dashboard).
Options include size (1–3 columns), height mode (auto, short, medium, tall, or fixed pixels),
chart type, color palette, and more. A sample widget configuration object:

```javascript
{
  chartType: 'bar',
  color: '#3b82f6',
  size: 2
}
```

Chart animations are tunable via **Chart animation (ms, 0=off)** in settings. The duration controls bar and pie chart growth and is disabled automatically when the browser reports `prefers-reduced-motion`.

Both `barChart` and `pieChart` also accept an `easing` option for custom animation curves. By default, animations use an `easeOutCubic` easing function.

### Data Storage

All preferences and financial data are stored in the browser's `localStorage`
under the key `cc-finance-tracker-v27`. Clearing your browser data will reset the app.

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bug fix.
2. Install dependencies and ensure tests pass.
3. Submit a pull request with a clear description of your changes.

## Quick Preview

A GitHub Pages deployment is available for an immediate preview:

1. Enable GitHub Pages in your repository settings and point it to the `dist/` directory after running the build command above.
2. Visit `https://<your-user>.github.io/Finance-Tracker/` to view the site once the deployment finishes.

import { useState, useEffect } from 'react';
import { getTransactions, getAccounts } from '../services/api';
import {
  DocumentChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('profit-loss');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState(null);

  const reports = [
    { id: 'profit-loss', name: 'Profit & Loss', icon: ChartBarIcon },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: DocumentChartBarIcon },
    { id: 'cash-flow', name: 'Cash Flow Statement', icon: ChartBarIcon },
  ];

  useEffect(() => {
    generateReport();
  }, [activeReport, startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [transactionsRes, accountsRes] = await Promise.all([
        getTransactions({ startDate, endDate }),
        getAccounts(),
      ]);

      const transactions = transactionsRes.data || [];
      const accounts = accountsRes.data || [];

      if (activeReport === 'profit-loss') {
        generateProfitLoss(transactions, accounts);
      } else if (activeReport === 'balance-sheet') {
        generateBalanceSheet(transactions, accounts);
      } else if (activeReport === 'cash-flow') {
        generateCashFlowStatement(transactions, accounts);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateProfitLoss = (transactions, accounts) => {
    const income = {};
    const expenses = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((txn) => {
      txn.TransactionLines?.forEach((line) => {
        const account = accounts.find((a) => a.id === line.accountId);
        if (!account) return;

        const amount = parseFloat(line.debit || line.credit || 0);

        if (account.type === 'income') {
          if (!income[account.name]) income[account.name] = 0;
          income[account.name] += amount;
          totalIncome += amount;
        } else if (account.type === 'expense') {
          if (!expenses[account.name]) expenses[account.name] = 0;
          expenses[account.name] += amount;
          totalExpenses += amount;
        }
      });
    });

    const netIncome = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    setReportData({
      type: 'profit-loss',
      income: Object.entries(income).map(([name, amount]) => ({ name, amount })),
      expenses: Object.entries(expenses).map(([name, amount]) => ({ name, amount })),
      totalIncome,
      totalExpenses,
      netIncome,
      margin,
    });
  };

  const generateBalanceSheet = (transactions, accounts) => {
    const assets = {};
    const liabilities = {};
    const equity = {};
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    transactions.forEach((txn) => {
      txn.TransactionLines?.forEach((line) => {
        const account = accounts.find((a) => a.id === line.accountId);
        if (!account) return;

        const debit = parseFloat(line.debit || 0);
        const credit = parseFloat(line.credit || 0);
        const amount = debit - credit;

        if (account.type === 'asset') {
          if (!assets[account.name]) assets[account.name] = 0;
          assets[account.name] += amount;
          totalAssets += amount;
        } else if (account.type === 'liability') {
          if (!liabilities[account.name]) liabilities[account.name] = 0;
          liabilities[account.name] += amount;
          totalLiabilities += amount;
        } else if (account.type === 'equity') {
          if (!equity[account.name]) equity[account.name] = 0;
          equity[account.name] += amount;
          totalEquity += amount;
        }
      });
    });

    setReportData({
      type: 'balance-sheet',
      assets: Object.entries(assets).map(([name, amount]) => ({ name, amount })),
      liabilities: Object.entries(liabilities).map(([name, amount]) => ({ name, amount })),
      equity: Object.entries(equity).map(([name, amount]) => ({ name, amount })),
      totalAssets,
      totalLiabilities,
      totalEquity,
    });
  };

  const generateCashFlowStatement = (transactions, accounts) => {
    const operating = [];
    const investing = [];
    const financing = [];
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;

    transactions.forEach((txn) => {
      const amount = parseFloat(
        txn.TransactionLines?.[0]?.debit || txn.TransactionLines?.[0]?.credit || 0
      );
      const isInflow = txn.TransactionLines?.[0]?.debit > 0;

      // Simplified categorization based on transaction type
      if (txn.type === 'bank' || txn.type === 'journal') {
        operating.push({
          description: txn.description,
          amount: isInflow ? amount : -amount,
          date: txn.date,
        });
        totalOperating += isInflow ? amount : -amount;
      } else if (txn.type === 'credit_card') {
        financing.push({
          description: txn.description,
          amount: isInflow ? amount : -amount,
          date: txn.date,
        });
        totalFinancing += isInflow ? amount : -amount;
      }
    });

    const netCashFlow = totalOperating + totalInvesting + totalFinancing;

    setReportData({
      type: 'cash-flow',
      operating,
      investing,
      financing,
      totalOperating,
      totalInvesting,
      totalFinancing,
      netCashFlow,
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    const reportTitle = reports.find((r) => r.id === activeReport)?.name || 'Report';
    csv += `${reportTitle}\n`;
    csv += `Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(
      new Date(endDate),
      'MMM dd, yyyy'
    )}\n\n`;

    if (reportData.type === 'profit-loss') {
      csv += 'Income\n';
      reportData.income.forEach((item) => {
        csv += `${item.name},${item.amount.toFixed(2)}\n`;
      });
      csv += `Total Income,${reportData.totalIncome.toFixed(2)}\n\n`;

      csv += 'Expenses\n';
      reportData.expenses.forEach((item) => {
        csv += `${item.name},${item.amount.toFixed(2)}\n`;
      });
      csv += `Total Expenses,${reportData.totalExpenses.toFixed(2)}\n\n`;

      csv += `Net Income,${reportData.netIncome.toFixed(2)}\n`;
      csv += `Profit Margin,${reportData.margin.toFixed(2)}%\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button
          onClick={exportToCSV}
          disabled={!reportData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`${
                  activeReport === report.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
              >
                <report.icon className="h-5 w-5" />
                {report.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Date Range Selector */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => {
                  setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                  setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  setStartDate(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
                  setEndDate(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="text-gray-500">Generating report...</div>
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-lg shadow p-6">
          {activeReport === 'profit-loss' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
                <p className="text-sm text-gray-500">
                  {format(new Date(startDate), 'MMMM dd, yyyy')} -{' '}
                  {format(new Date(endDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              {/* Income Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Income
                </h3>
                {reportData.income?.length > 0 ? (
                  <div className="space-y-2">
                    {reportData.income.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-900">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>Total Income</span>
                      <span className="text-green-600">
                        ${reportData.totalIncome.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No income recorded in this period</p>
                )}
              </div>

              {/* Expenses Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Expenses
                </h3>
                {reportData.expenses?.length > 0 ? (
                  <div className="space-y-2">
                    {reportData.expenses.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-900">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>Total Expenses</span>
                      <span className="text-red-600">
                        ${reportData.totalExpenses.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No expenses recorded in this period</p>
                )}
              </div>

              {/* Net Income */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-gray-900">Net Income</span>
                  <span
                    className={`text-2xl font-bold ${
                      reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${reportData.netIncome.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-medium text-gray-900">
                    {reportData.margin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'balance-sheet' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Balance Sheet</h2>
                <p className="text-sm text-gray-500">
                  As of {format(new Date(endDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Assets
                  </h3>
                  {reportData.assets?.length > 0 ? (
                    <div className="space-y-2">
                      {reportData.assets.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Total Assets</span>
                        <span className="text-blue-600">
                          ${reportData.totalAssets.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No assets recorded</p>
                  )}
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Liabilities
                  </h3>
                  {reportData.liabilities?.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      {reportData.liabilities.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Total Liabilities</span>
                        <span className="text-red-600">
                          ${reportData.totalLiabilities.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-6">No liabilities recorded</p>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                    Equity
                  </h3>
                  {reportData.equity?.length > 0 ? (
                    <div className="space-y-2">
                      {reportData.equity.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                        <span>Total Equity</span>
                        <span className="text-green-600">
                          ${reportData.totalEquity.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No equity recorded</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeReport === 'cash-flow' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cash Flow Statement</h2>
                <p className="text-sm text-gray-500">
                  {format(new Date(startDate), 'MMMM dd, yyyy')} -{' '}
                  {format(new Date(endDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              {/* Operating Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">
                  Operating Activities
                </h3>
                {reportData.operating?.length > 0 ? (
                  <div className="space-y-2">
                    {reportData.operating.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.description}</span>
                        <span
                          className={`font-medium ${
                            item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>Net Operating Cash Flow</span>
                      <span
                        className={reportData.totalOperating >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        ${reportData.totalOperating.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No operating activities recorded</p>
                )}
              </div>

              {/* Net Cash Flow */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Net Cash Flow</span>
                  <span
                    className={`text-2xl font-bold ${
                      reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${reportData.netCashFlow.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DocumentChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a date range to generate your report</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getCashFlow, getCashFlowForecast, getTransactions } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function CashFlow() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [summary, setSummary] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0,
    avgDailyFlow: 0,
    trend: 'neutral',
  });

  useEffect(() => {
    loadCashFlowData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRangeDates = () => {
    const end = new Date();
    let start;

    switch (dateRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '6m':
        start = subMonths(end, 6);
        break;
      case '1y':
        start = subMonths(end, 12);
        break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : subDays(end, 30);
        return { start, end: customEndDate ? new Date(customEndDate) : end };
      default:
        start = subDays(end, 30);
    }

    return { start, end };
  };

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRangeDates();
      const response = await getTransactions({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      });

      const txns = response.data?.transactions || [];
      setTransactions(txns);

      // Process transactions for cash flow analysis
      const dailyFlow = {};
      let totalInflow = 0;
      let totalOutflow = 0;

      txns.forEach((txn) => {
        const date = format(new Date(txn.date), 'MMM dd');
        const amount = parseFloat(
          txn.TransactionLines?.[0]?.debit || txn.TransactionLines?.[0]?.credit || 0
        );

        if (!dailyFlow[date]) {
          dailyFlow[date] = { date, inflow: 0, outflow: 0, net: 0 };
        }

        // Determine if it's income or expense based on account type or transaction type
        const isIncome = txn.TransactionLines?.[0]?.debit > 0;

        if (isIncome) {
          dailyFlow[date].inflow += amount;
          totalInflow += amount;
        } else {
          dailyFlow[date].outflow += amount;
          totalOutflow += amount;
        }

        dailyFlow[date].net = dailyFlow[date].inflow - dailyFlow[date].outflow;
      });

      const flowData = Object.values(dailyFlow).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setCashFlowData(flowData);

      const netCashFlow = totalInflow - totalOutflow;
      const days = Math.max(1, flowData.length);
      const avgDailyFlow = netCashFlow / days;
      const trend = netCashFlow > 0 ? 'up' : netCashFlow < 0 ? 'down' : 'neutral';

      setSummary({
        totalInflow,
        totalOutflow,
        netCashFlow,
        avgDailyFlow,
        trend,
      });
    } catch (error) {
      console.error('Failed to load cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBreakdown = () => {
    const categories = {};

    transactions.forEach((txn) => {
      const category = txn.type || 'Other';
      const amount = parseFloat(
        txn.TransactionLines?.[0]?.credit || txn.TransactionLines?.[0]?.debit || 0
      );

      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  };

  const getMonthlyComparison = () => {
    const monthly = {};

    transactions.forEach((txn) => {
      const month = format(new Date(txn.date), 'MMM yyyy');
      const amount = parseFloat(
        txn.TransactionLines?.[0]?.debit || txn.TransactionLines?.[0]?.credit || 0
      );
      const isIncome = txn.TransactionLines?.[0]?.debit > 0;

      if (!monthly[month]) {
        monthly[month] = { month, income: 0, expenses: 0 };
      }

      if (isIncome) {
        monthly[month].income += amount;
      } else {
        monthly[month].expenses += amount;
      }
    });

    return Object.values(monthly);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const categoryData = getCategoryBreakdown();
  const monthlyData = getMonthlyComparison();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cash Flow Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Inflow</p>
              <p className="text-2xl font-bold text-green-600">
                ${summary.totalInflow.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Outflow</p>
              <p className="text-2xl font-bold text-red-600">
                ${summary.totalOutflow.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
              <p
                className={`text-2xl font-bold ${
                  summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${summary.netCashFlow.toFixed(2)}
              </p>
            </div>
            <div
              className={`${
                summary.netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'
              } rounded-lg p-3`}
            >
              <CurrencyDollarIcon
                className={`h-6 w-6 ${
                  summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Daily Flow</p>
              <p
                className={`text-2xl font-bold ${
                  summary.avgDailyFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${summary.avgDailyFlow.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cash Flow Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h2>
          {cashFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="inflow"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Inflow"
                />
                <Line
                  type="monotone"
                  dataKey="outflow"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Outflow"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Net"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Income vs Expenses
          </h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Category Breakdown
          </h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`${
                  summary.trend === 'up'
                    ? 'bg-green-100 text-green-600'
                    : summary.trend === 'down'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                } rounded-full p-2`}
              >
                {summary.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                ) : summary.trend === 'down' ? (
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                ) : (
                  <ChartBarIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Overall Trend</p>
                <p className="text-sm text-gray-600">
                  {summary.trend === 'up'
                    ? 'Your cash flow is positive. Keep up the good work!'
                    : summary.trend === 'down'
                    ? 'Your cash flow is negative. Consider reviewing expenses.'
                    : 'Your cash flow is neutral. Monitor closely.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                <CurrencyDollarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Burn Rate</p>
                <p className="text-sm text-gray-600">
                  Average daily outflow: ${(summary.totalOutflow / Math.max(1, cashFlowData.length)).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                <ChartBarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Transaction Count</p>
                <p className="text-sm text-gray-600">
                  {transactions.length} transactions in the selected period
                </p>
              </div>
            </div>

            {summary.totalInflow > 0 && summary.totalOutflow > 0 && (
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 text-yellow-600 rounded-full p-2">
                  <ChartBarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Efficiency Ratio</p>
                  <p className="text-sm text-gray-600">
                    ${((summary.totalInflow / summary.totalOutflow) * 100).toFixed(0)}% -
                    For every $1 spent, you earn $
                    {(summary.totalInflow / summary.totalOutflow).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

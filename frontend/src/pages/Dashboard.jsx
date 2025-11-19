import { useEffect, useState } from 'react';
import { getDashboardData, getTransactions, getInvoices, getBills } from '../services/api';
import { Link } from 'react-router-dom';
import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cashFlowTrend, setCashFlowTrend] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [dashboardRes, transactionsRes, billsRes, invoicesRes] = await Promise.all([
        getDashboardData(),
        getTransactions({ limit: 5 }),
        getBills(),
        getInvoices({ limit: 5 }),
      ]);

      setData(dashboardRes.data);
      setRecentTransactions(transactionsRes.data?.slice(0, 5) || []);
      setRecentInvoices(invoicesRes.data?.slice(0, 5) || []);

      // Filter upcoming bills (unpaid)
      const upcoming = (billsRes.data || [])
        .filter(bill => bill.status !== 'paid')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      setUpcomingBills(upcoming);

      // Calculate cash flow trend for last 7 days
      const last7Days = [];
      const transactions = transactionsRes.data || [];

      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const dayTransactions = transactions.filter(
          t => format(new Date(t.date), 'yyyy-MM-dd') === dateStr
        );

        let inflow = 0;
        let outflow = 0;

        dayTransactions.forEach(t => {
          const amount = parseFloat(t.TransactionLines?.[0]?.debit || t.TransactionLines?.[0]?.credit || 0);
          if (t.TransactionLines?.[0]?.debit > 0) {
            inflow += amount;
          } else {
            outflow += amount;
          }
        });

        last7Days.push({
          date: format(date, 'MMM dd'),
          inflow,
          outflow,
          net: inflow - outflow,
        });
      }

      setCashFlowTrend(last7Days);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Cash',
      value: data?.totalCash || '$0.00',
      icon: BanknotesIcon,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      name: 'Accounts Receivable',
      value: data?.accountsReceivable || '$0.00',
      icon: CurrencyDollarIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: '+4.3%',
      changeType: 'increase',
    },
    {
      name: 'Accounts Payable',
      value: data?.accountsPayable || '$0.00',
      icon: DocumentTextIcon,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      change: '-2.1%',
      changeType: 'decrease',
    },
    {
      name: 'Credit Card Balance',
      value: data?.creditCardBalance || '$0.00',
      icon: CreditCardIcon,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: '+8.2%',
      changeType: 'increase',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              {stat.change && (
                <div className="flex items-center">
                  {stat.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cash Flow Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">7-Day Cash Flow Trend</h2>
          <Link
            to="/cash-flow"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details →
          </Link>
        </div>
        {cashFlowTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cashFlowTrend}>
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
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No transaction data available
          </div>
        )}
      </div>

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <BanknotesIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${parseFloat(
                        transaction.TransactionLines?.[0]?.debit ||
                          transaction.TransactionLines?.[0]?.credit ||
                          0
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No recent transactions</p>
              <Link
                to="/transactions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
              >
                Add your first transaction →
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bills</h2>
            <Link
              to="/accounts-payable"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {upcomingBills.length > 0 ? (
            <div className="space-y-3">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 rounded-lg p-2">
                      <ClockIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {bill.Vendor?.name || 'Unknown Vendor'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${parseFloat(bill.amount).toFixed(2)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No upcoming bills</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <Link
            to="/invoices"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {invoice.Customer?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(invoice.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent invoices</p>
            <Link
              to="/invoices"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
            >
              Create your first invoice →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

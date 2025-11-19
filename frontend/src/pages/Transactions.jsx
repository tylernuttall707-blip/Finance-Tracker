import { useEffect, useState } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getAccounts } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, CalendarIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import CSVImportModal from '../components/CSVImportModal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'bank',
    reference: '',
    debitAccountId: '',
    creditAccountId: '',
    amount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsRes, accountsRes] = await Promise.all([
        getTransactions(),
        getAccounts(),
      ]);
      setTransactions(transactionsRes.data?.transactions || []);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
      } else {
        await createTransaction(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      type: transaction.type,
      reference: transaction.reference || '',
      debitAccountId: transaction.TransactionLines?.[0]?.accountId || '',
      creditAccountId: transaction.TransactionLines?.[1]?.accountId || '',
      amount: transaction.TransactionLines?.[0]?.debit || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'bank',
      reference: '',
      debitAccountId: '',
      creditAccountId: '',
      amount: '',
    });
    setEditingTransaction(null);
  };

  const filteredTransactions = transactions.filter((t) => {
    // Filter by type
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Filter by search query
    if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const txnDate = new Date(t.date);
      const today = new Date();

      if (dateRange === '7d') {
        if (txnDate < subDays(today, 7)) return false;
      } else if (dateRange === '30d') {
        if (txnDate < subDays(today, 30)) return false;
      } else if (dateRange === '90d') {
        if (txnDate < subDays(today, 90)) return false;
      } else if (dateRange === 'this-month') {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        if (txnDate < start || txnDate > end) return false;
      } else if (dateRange === 'last-month') {
        const lastMonth = subMonths(today, 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        if (txnDate < start || txnDate > end) return false;
      } else if (dateRange === 'custom') {
        if (customStartDate && txnDate < new Date(customStartDate)) return false;
        if (customEndDate && txnDate > new Date(customEndDate)) return false;
      }
    }

    return true;
  });

  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'bank') {
      const amount = parseFloat(t.TransactionLines?.[0]?.debit || 0);
      acc.income += amount;
    }
    return acc;
  }, { income: 0, expenses: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cashflow Tracker</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            ${summary.income.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            ${summary.expenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${summary.income - summary.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(summary.income - summary.expenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="bank">Bank</option>
              <option value="credit_card">Credit Card</option>
              <option value="journal">Journal Entry</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start Date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End Date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </>
          )}

          {/* Search */}
          <div className={dateRange === 'custom' ? 'md:col-span-2 lg:col-span-4' : ''}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(filterType !== 'all' || dateRange !== 'all' || searchQuery) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Active filters:</span>
              {filterType !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Type: {filterType}
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Date: {dateRange}
                  <button
                    onClick={() => {
                      setDateRange('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-blue-600">
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setFilterType('all');
                  setDateRange('all');
                  setSearchQuery('');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No transactions found. Click "Add Transaction" to get started.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${parseFloat(transaction.TransactionLines?.[0]?.debit || transaction.TransactionLines?.[0]?.credit || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bank">Bank</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="journal">Journal Entry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Check #, Invoice #, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => loadData()}
        accounts={accounts}
      />
    </div>
  );
}

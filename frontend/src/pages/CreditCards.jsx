import { useEffect, useState } from 'react';
import { getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function CreditCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    lastFour: '',
    creditLimit: '',
    currentBalance: '',
    apr: '',
    dueDay: '',
    statementDay: '',
    notes: '',
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await getCreditCards();
      setCards(response.data);
    } catch (error) {
      console.error('Failed to load credit cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        currentBalance: parseFloat(formData.currentBalance) || 0,
        apr: parseFloat(formData.apr) || 0,
        dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
        statementDay: formData.statementDay ? parseInt(formData.statementDay) : null,
      };

      if (editingCard) {
        await updateCreditCard(editingCard.id, dataToSend);
      } else {
        await createCreditCard(dataToSend);
      }
      setShowModal(false);
      resetForm();
      loadCards();
    } catch (error) {
      console.error('Failed to save credit card:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this credit card?')) {
      try {
        await deleteCreditCard(id);
        loadCards();
      } catch (error) {
        console.error('Failed to delete credit card:', error);
      }
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      issuer: card.issuer || '',
      lastFour: card.lastFour || '',
      creditLimit: card.creditLimit,
      currentBalance: card.currentBalance,
      apr: card.apr,
      dueDay: card.dueDay || '',
      statementDay: card.statementDay || '',
      notes: card.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      issuer: '',
      lastFour: '',
      creditLimit: '',
      currentBalance: '',
      apr: '',
      dueDay: '',
      statementDay: '',
      notes: '',
    });
    setEditingCard(null);
  };

  const calculateUtilization = (balance, limit) => {
    if (!limit || limit === 0) return 0;
    return ((balance / limit) * 100).toFixed(1);
  };

  const calculateAvailable = (limit, balance) => {
    return (limit - balance).toFixed(2);
  };

  const summary = cards.reduce((acc, card) => {
    acc.totalBalance += parseFloat(card.currentBalance) || 0;
    acc.totalLimit += parseFloat(card.creditLimit) || 0;
    acc.totalAvailable += parseFloat(calculateAvailable(card.creditLimit, card.currentBalance));
    return acc;
  }, { totalBalance: 0, totalLimit: 0, totalAvailable: 0 });

  const avgUtilization = cards.length > 0
    ? (summary.totalBalance / summary.totalLimit * 100).toFixed(1)
    : 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Credit Card Tracker</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Card
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-red-600">
            ${summary.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Available</p>
          <p className="text-2xl font-bold text-green-600">
            ${summary.totalAvailable.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Limit</p>
          <p className="text-2xl font-bold text-gray-900">
            ${summary.totalLimit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Avg Utilization</p>
          <p className={`text-2xl font-bold ${avgUtilization > 30 ? 'text-red-600' : 'text-green-600'}`}>
            {avgUtilization}%
          </p>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No credit cards added yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Card
            </button>
          </div>
        ) : (
          cards.map((card) => {
            const utilization = calculateUtilization(card.currentBalance, card.creditLimit);
            const available = calculateAvailable(card.creditLimit, card.currentBalance);

            return (
              <div key={card.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{card.name}</h3>
                      <p className="text-sm opacity-90">{card.issuer}</p>
                    </div>
                    <CreditCardIcon className="h-8 w-8" />
                  </div>
                  {card.lastFour && (
                    <p className="text-sm opacity-90">•••• {card.lastFour}</p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Balance</span>
                      <span className="font-semibold text-red-600">
                        ${parseFloat(card.currentBalance).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Available Credit</span>
                      <span className="font-semibold text-green-600">
                        ${available}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Credit Limit</span>
                      <span className="font-semibold">
                        ${parseFloat(card.creditLimit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className={`font-semibold ${utilization > 30 ? 'text-red-600' : 'text-green-600'}`}>
                        {utilization}%
                      </span>
                    </div>
                    {card.apr > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">APR</span>
                        <span className="font-semibold">{card.apr}%</span>
                      </div>
                    )}
                    {card.dueDay && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Due</span>
                        <span className="font-semibold">Day {card.dueDay}</span>
                      </div>
                    )}
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(card)}
                      className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="My Chase Card"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issuer</label>
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Chase, AmEx, Visa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Four Digits</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={formData.lastFour}
                    onChange={(e) => setFormData({ ...formData, lastFour: e.target.value.replace(/\D/g, '') })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Credit Limit *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Balance *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">APR (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.apr}
                    onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="15.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Due Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statement Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.statementDay}
                    onChange={(e) => setFormData({ ...formData, statementDay: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
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
                  {editingCard ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const STEP_UPLOAD = 'upload';
const STEP_REVIEW = 'review';
const STEP_IMPORTING = 'importing';
const STEP_COMPLETE = 'complete';

export default function CSVImportModal({ isOpen, onClose, onImportComplete, accounts }) {
  const [step, setStep] = useState(STEP_UPLOAD);
  const [file, setFile] = useState(null);
  const [bankAccountId, setBankAccountId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [importing, setImporting] = useState(false);

  // Filter accounts to show only asset accounts for bank selection
  const bankAccounts = accounts.filter(acc => acc.type === 'asset');

  // Filter accounts for categorization (exclude bank accounts)
  const categorizationAccounts = accounts.filter(acc => acc.type !== 'asset');

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(STEP_UPLOAD);
    setFile(null);
    setBankAccountId('');
    setTransactions([]);
    setErrors([]);
    setBatchId(null);
    setImporting(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file || !bankAccountId) {
      alert('Please select a file and bank account');
      return;
    }

    setStep(STEP_IMPORTING);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankAccountId', bankAccountId);

      const response = await fetch('http://localhost:3000/api/transactions/upload-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setTransactions(data.transactions || []);
      setErrors(data.errors || []);
      setBatchId(data.batchId);
      setStep(STEP_REVIEW);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file. Please try again.');
      setStep(STEP_UPLOAD);
    }
  };

  const handleAccountChange = (index, accountId) => {
    const updated = [...transactions];
    updated[index].accountId = accountId;

    // Update suggestion info
    const account = categorizationAccounts.find(a => a.id === accountId);
    if (account) {
      updated[index].selectedAccountName = account.name;
    }

    setTransactions(updated);
  };

  const handleSelectAll = () => {
    const updated = transactions.map(t => ({
      ...t,
      accountId: t.suggestedAccountId || t.accountId,
    }));
    setTransactions(updated);
  };

  const handleImport = async () => {
    // Filter transactions with selected accounts
    const transactionsToImport = transactions.filter(t => t.accountId);

    if (transactionsToImport.length === 0) {
      alert('Please select accounts for at least one transaction');
      return;
    }

    setImporting(true);

    try {
      const response = await fetch('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          batchId,
          bankAccountId,
          transactions: transactionsToImport,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      setStep(STEP_COMPLETE);

      // Call completion callback after a brief delay
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing transactions. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          High
        </span>
      );
    } else if (confidence >= 0.5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          Medium
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          Low
        </span>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Import CSV Transactions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Upload */}
          {step === STEP_UPLOAD && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank Account *
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a bank account...</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Select the bank account these transactions belong to
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File *
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Choose a file
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">CSV file up to 5MB</p>
                  {file && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">CSV Format Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>File must include headers in the first row</li>
                      <li>Required columns: Date, Description, Amount (or Debit/Credit)</li>
                      <li>Optional columns: Reference, Check Number, Transaction ID</li>
                      <li>Various date formats are supported (MM/DD/YYYY, YYYY-MM-DD, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Importing */}
          {step === STEP_IMPORTING && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-lg text-gray-700">Processing CSV file...</p>
              <p className="mt-2 text-sm text-gray-500">Analyzing transactions and generating suggestions</p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === STEP_REVIEW && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Found {errors.length} error(s)</p>
                      <ul className="list-disc list-inside mt-2">
                        {errors.slice(0, 3).map((error, idx) => (
                          <li key={idx}>Line {error.line}: {error.error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Found {transactions.length} transaction(s)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Review and adjust account assignments below
                    </p>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Accept All Suggestions
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category Account
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.reason && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {transaction.reason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            <span
                              className={`font-medium ${
                                transaction.amount < 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={transaction.accountId || ''}
                              onChange={(e) => handleAccountChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select account...</option>
                              {categorizationAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transaction.confidence
                              ? getConfidenceBadge(transaction.confidence)
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === STEP_COMPLETE && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
              <p className="mt-4 text-lg font-medium text-gray-900">Import Complete!</p>
              <p className="mt-2 text-sm text-gray-500">
                Transactions have been imported successfully
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {step === STEP_UPLOAD && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || !bankAccountId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Upload & Review
              </button>
            </>
          )}

          {step === STEP_REVIEW && (
            <>
              <button
                onClick={() => setStep(STEP_UPLOAD)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || transactions.filter(t => t.accountId).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${transactions.filter(t => t.accountId).length} Transaction(s)`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

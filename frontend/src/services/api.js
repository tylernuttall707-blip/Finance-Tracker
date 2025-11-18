import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (name, email, password) => api.post('/auth/register', { name, email, password });

// Chart of Accounts
export const getAccounts = () => api.get('/accounts');
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const importTransactions = (formData) => api.post('/transactions/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Vendors
export const getVendors = () => api.get('/vendors');
export const createVendor = (data) => api.post('/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Bills (AP)
export const getBills = () => api.get('/bills');
export const createBill = (data) => api.post('/bills', data);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);
export const payBill = (id, data) => api.post(`/bills/${id}/pay`, data);

// Invoices (AR)
export const getInvoices = () => api.get('/invoices');
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const recordPayment = (id, data) => api.post(`/invoices/${id}/payment`, data);

// Credit Cards
export const getCreditCards = () => api.get('/credit-cards');
export const createCreditCard = (data) => api.post('/credit-cards', data);
export const updateCreditCard = (id, data) => api.put(`/credit-cards/${id}`, data);
export const deleteCreditCard = (id) => api.delete(`/credit-cards/${id}`);

// Reports
export const getProfitLoss = (startDate, endDate) => api.get('/reports/profit-loss', { params: { startDate, endDate } });
export const getBalanceSheet = (date) => api.get('/reports/balance-sheet', { params: { date } });
export const getCashFlow = (startDate, endDate) => api.get('/reports/cash-flow', { params: { startDate, endDate } });
export const getCashFlowForecast = (months) => api.get('/reports/cash-flow-forecast', { params: { months } });

// Dashboard
export const getDashboardData = () => api.get('/dashboard');

export default api;

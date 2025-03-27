"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction } from '@prisma/client';
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, Search, PieChart, Loader, LogOut, User } from 'react-feather';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TransactionWithUser extends Transaction {
  user?: {
    name: string;
    email: string;
  };
}


const expenseCategories = [
  "Groceries",
  "Water Bill",
  "Electricity",
  "Building Rental",
  "Furnitures",
  "Glass and Crock",
  "Staff Salary",
  "Staff Service Charge",
];

const incomeCategories = [
  "Restaurant",
  "Surf Lessons",
  "Surf Board Rental",
];


export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE',
    category: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  const getCategories = () => {
    switch (formData.type) {
      case "EXPENSE":
        return expenseCategories;
      case "INCOME":
        return incomeCategories;
      case "OTHER":
        return ["Other"];
      default:
        return [];
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/session');
                if (!res.ok) {
                    router.push('/login');
                    return;
                }

                const data = await res.json();
                setCurrentUser(data.user);
                setIsAdmin(data.user.role === 'ADMIN');
            } catch (error) {
                console.error('Auth error:', error);
                setErrorMessage('Authentication error');
                router.push('/login');
            }
        };

        fetchUser();
    }, []);


  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);


  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        router.push('/login');
      } else {
        setErrorMessage('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setErrorMessage('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions?page=${page}&pageSize=${pageSize}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          // Unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const { transactions, pagination } = await res.json();
      
      // Make sure transactions is an array before setting state
      setTransactions(Array.isArray(transactions) ? transactions : []);
      
      // Set pagination information
      setPagination({
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages
      });
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setErrorMessage('Failed to fetch transactions');
      setTransactions([]); // Reset to empty array on error
      setPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error('Transaction failed');
      }
      
      fetchTransactions();
      setFormData({ amount: '', type: 'EXPENSE', category: '', description: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Submit transaction error:', error);
      setErrorMessage('Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: TransactionWithUser) => {
    // Check if user has permission to edit this transaction
    if (!isAdmin && transaction.userId !== currentUser?.id) {
      setErrorMessage("You don't have permission to edit this transaction");
      return;
    }
    
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      description: transaction.description
    });
    setEditingId(transaction.id);
  };

  const handleDelete = async (id: number) => {
    try {
      // Check if user has permission before attempting deletion
      const transaction = transactions.find(t => t.id === id);
      if (!isAdmin && transaction?.userId !== currentUser?.id) {
        setErrorMessage("You don't have permission to delete this transaction");
        return;
      }
      
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error('Delete failed');
      }
      
      fetchTransactions();
    } catch (error) {
      console.error('Delete transaction error:', error);
      setErrorMessage('Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalance = () => {
    // For non-admin users, only show their own balance
    const filteredTransactions = isAdmin 
      ? transactions 
      : transactions.filter(t => t.userId === currentUser?.id);
      
    return filteredTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'INCOME' || transaction.type === 'OTHER') 
        return acc + transaction.amount;
      return acc - transaction.amount;
    }, 0);
  };


  // Rest of the component (UI) remains the same...
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin">
            <Loader className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-600">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteCandidate(null); // Immediately close the dialog
                  handleDelete(deleteCandidate); // Then initiate delete
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in-up">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">!</span>
          </div>
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLoading ? 'blur-sm' : ''}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <PieChart className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-sm text-gray-600">Current Balance:</span>
              <span className={`ml-2 text-xl font-semibold ${
                calculateBalance() >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                Rs.{calculateBalance().toFixed(2)}
              </span>
            </div>
            
            {currentUser && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-2 p-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5"/>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex gap-4">
                {/* Type Dropdown */}
                <div className="w-2xl">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Category Dropdown */}
                <div className="w-2xl">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {getCategories().map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {editingId ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </form>
        </div>

        {/* Transactions Card - Improved Responsiveness with Search */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? 'All Transactions' : 'Your Transactions'}
            </h2>
          </div>

          {/* Filters and Search Section */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(transactions) && transactions
                  .filter(transaction => isAdmin || transaction.userId === currentUser?.id)
                  .filter(transaction => 
                    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'INCOME' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : transaction.type === 'EXPENSE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {transaction.type === 'INCOME' ? (
                            <ArrowUp className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDown className="w-4 h-4 mr-1" />
                          )}
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'} Rs.{transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(isAdmin || transaction.userId === currentUser?.id) && (
                          <>
                            <button 
                              onClick={() => handleEdit(transaction)}
                              className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg transition-colors"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setDeleteCandidate(transaction.id)}
                              className="text-gray-400 hover:text-red-600 ml-2 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {pagination.currentPage} of {pagination.totalPages} pages
                ({pagination.totalItems} total transactions)
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fetchTransactions(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-500 text-gray-900"
                >
                  Previous
                </button>
                <button 
                  onClick={() => fetchTransactions(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-500 text-gray-900"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
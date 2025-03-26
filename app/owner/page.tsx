"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction } from '@prisma/client';
import { 
  PieChart, Loader, LogOut, User, Users, Activity,
  BarChart2, Trash2, Search, Download, AlertTriangle
} from 'react-feather';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  totalTransactions?: number;
  totalExpense?: number;
  totalIncome?: number;
  balance?: number;
}

interface TransactionWithUser extends Transaction {
  user?: {
    name: string;
    email: string;
  };
}

interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  createdAt: string;
}

export default function OwnerDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [deleteUserCandidate, setDeleteUserCandidate] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const router = useRouter();

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchTransactions(),
        fetchActivityLogs()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    if (currentUser && currentUser.role === 'OWNER') {
      fetchAllData();
    }
  }, [currentUser]);

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
            } catch (error) {
                console.error('Auth error:', error);
                setErrorMessage('Authentication error');
                router.push('/login');
            }
        };

        fetchUser();
    }, []);

    
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch users error:', error);
      setErrorMessage('Failed to fetch users');
    }
  };



  const fetchActivityLogs = async () => {
    try {
      const res = await fetch('/api/activity-logs');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch activity logs error:', error);
      setErrorMessage('Failed to fetch activity logs');
    }
  };

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

  const handleDeleteUser = async (userId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userId));
      setDeleteUserCandidate(null);
      
    } catch (error) {
      console.error('Delete user error:', error);
      setErrorMessage('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalBalance = () => {
    return transactions.reduce((acc, transaction) => {
      if (transaction.type === 'INCOME') 
        return acc + transaction.amount;
      else if (transaction.type === 'EXPENSE')
        return acc - transaction.amount;
      return acc;
    }, 0);
  };

  const calculateUserStats = (userId: number) => {
    const userTransactions = transactions.filter(t => t.userId === userId);
    
    const totalIncome = userTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = userTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      totalTransactions: userTransactions.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  };

  const getTopCategories = () => {
    const categories: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(transaction => {
        if (categories[transaction.category]) {
          categories[transaction.category] += transaction.amount;
        } else {
          categories[transaction.category] = transaction.amount;
        }
      });
    
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  };

  const getMonthlyData = () => {
    const monthlyData: Record<string, {income: number, expense: number}> = {};
    
    // Initialize the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      monthlyData[monthYear] = { income: 0, expense: 0 };
    }
    
    // Fill with transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      // Only process if it's within our 6-month window
      if (monthlyData[monthYear]) {
        if (transaction.type === 'INCOME') {
          monthlyData[monthYear].income += transaction.amount;
        } else if (transaction.type === 'EXPENSE') {
          monthlyData[monthYear].expense += transaction.amount;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense
    }));
  };

  const getFilteredTransactions = () => {
    return transactions
      .filter(transaction => 
        // Filter by user if selected
        (selectedUser ? transaction.userId === selectedUser : true) &&
        // Filter by search term
        (searchTerm ? 
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
          : true
        ) &&
        // Filter by category
        (categoryFilter ? transaction.category === categoryFilter : true) &&
        // Filter by date
        (dateFilter !== 'all' ? filterByDate(transaction.date, dateFilter) : true)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filterByDate = (dateString: Date | string, filter: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    switch(filter) {
      case 'today':
        return date.toDateString() === today.toDateString();
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  

  const downloadReport = () => {
    try {
      // Create CSV content
      const headers = "Date,User,Type,Category,Description,Amount\n";
      const rows = getFilteredTransactions().map(t => {
        return `${new Date(t.date).toLocaleDateString()},${t.user?.name || 'Unknown'},"${t.type}","${t.category}","${t.description}",${t.amount}`;
      }).join('\n');
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and click it to trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      setErrorMessage('Failed to download report');
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    transactions.forEach(t => categories.add(t.category));
    return Array.from(categories).sort();
  };


  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/transactions');

      if (!res.ok) {
        if (res.status === 401) {
          // Unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();

      // Make sure data is an array before setting state
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setErrorMessage('Failed to fetch transactions');
      setTransactions([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  

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

      {/* Delete User Confirmation Modal */}
      {deleteUserCandidate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold">Confirm Delete User</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? All their transactions will be deleted as well. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteUserCandidate(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserCandidate)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete User
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <PieChart className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Steam Yard Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-sm text-gray-600">Total Balance:</span>
              <span className={`ml-2 text-xl font-semibold ${
                calculateTotalBalance() >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                Rs.{calculateTotalBalance().toFixed(2)}
              </span>
            </div>
            
            {currentUser && (
              <div className="flex items-center">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-2 p-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'overview' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'users' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'transactions' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'activity' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'analytics' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <div className="mt-4 text-sm text-gray-500">
                {users.filter(u => u.role === 'ADMIN').length} Admins, {users.filter(u => u.role === 'USER').length} Regular Users
              </div>
            </div>

            {/* Total Transactions Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Transactions</h3>
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
              <div className="mt-4 text-sm text-gray-500">
                {transactions.filter(t => t.type === 'INCOME').length} Income, {transactions.filter(t => t.type === 'EXPENSE').length} Expenses
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <BarChart2 className="w-6 h-6 text-emerald-600" />
              </div>
              {activityLogs
                .slice() // Clone the array to avoid modifying state
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Convert strings to Date and sort
                .slice(0, 3) // Take the top 3 most recent activities
                .map(log => (
                  <div key={log.id} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
                    <p className="text-sm font-medium text-red-500">
                      {log.userName} {log.action} a {log.entityType}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                ))
              }
              {activityLogs.length === 0 && (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {users
                    .filter(user => 
                      user.role !== 'OWNER' && // Don't show owner in the list
                      (searchTerm ? 
                        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                        : true
                      )
                    )
                    .map((user) => {
                      const stats = calculateUserStats(user.id);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.totalTransactions}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                            stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            Rs.{stats.balance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => setDeleteUserCandidate(user.id)}
                              className="text-gray-400 hover:text-red-600 ml-2 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
                
                <div className="flex flex-wrap gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute top-3 left-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* User Filter */}
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">All Users</option>
                    {users
                      .filter(u => u.role !== 'OWNER')
                      .map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))
                    }
                  </select>
                  
                  {/* Category Filter */}
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  {/* Date Filter */}
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="month">Last Month</option>
                    <option value="week">Last Week</option>
                    <option value="today">Today</option>
                  </select>
                  
                  {/* Export Button */}
                  <button
                    onClick={downloadReport}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-gray-200">
                  {getFilteredTransactions().map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        Rs.{transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getFilteredTransactions().length === 0 && (
                <div className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activity..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-emerald-50 border-b border-emerald-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Entity Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {activityLogs
                    .filter(log => 
                      searchTerm ? 
                        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.details.toLowerCase().includes(searchTerm.toLowerCase())
                        : true
                    )
                    .map((log) => {
                      // Parse the details JSON
                      let parsedDetails;
                      try {
                        parsedDetails = JSON.parse(log.details);
                      } catch {
                        parsedDetails = log.details;
                      }

                      return (
                        <tr key={log.id} className="hover:bg-emerald-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {log.userName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' : 
                                log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' : 
                                log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {log.entityType}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {typeof parsedDetails === 'object' ? (
                              <div className="space-y-1">
                                {log.action === 'UPDATE' && parsedDetails.before && parsedDetails.after ? (
                                  <div className="bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-600">Before:</span>
                                      <span className="text-red-600">
                                        {Object.entries(parsedDetails.before).map(([key, value]) => 
                                          `${key}: ${value}`
                                        ).join(', ')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                      <span className="font-medium text-gray-600">After:</span>
                                      <span className="text-emerald-600">
                                        {Object.entries(parsedDetails.after).map(([key, value]) => 
                                          `${key}: ${value}`
                                        ).join(', ')}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(parsedDetails, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ) : (
                              <span>{log.details}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
              {activityLogs.filter(log => 
                searchTerm ? 
                  log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.details.toLowerCase().includes(searchTerm.toLowerCase())
                  : true
              ).length === 0 && (
                <div className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No activity logs found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Income vs Expense Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expense</h3>
              <div className="h-80">
                {/* We'll need to implement a chart library like recharts here */}
                <div className="flex flex-col h-full">
                  {getMonthlyData().map((data, index) => (
                    <div key={index} className="flex flex-col mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">{data.month}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="h-6 bg-emerald-500 rounded-sm" 
                          style={{ width: `${(data.income / Math.max(...getMonthlyData().map(d => Math.max(d.income, d.expense)))) * 100}%` }}
                        />
                        <span className="text-xs text-emerald-700">Rs.{data.income.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-6 bg-red-500 rounded-sm" 
                          style={{ width: `${(data.expense / Math.max(...getMonthlyData().map(d => Math.max(d.income, d.expense)))) * 100}%` }}
                        />
                        <span className="text-xs text-red-700">Rs.{data.expense.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Top Expense Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
              <div className="space-y-4">
                {getTopCategories().map((category, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      <span className="text-sm text-gray-600">Rs.{category.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(category.amount / getTopCategories()[0].amount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* User Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users
                      .filter(user => user.role !== 'OWNER')
                      .map((user) => {
                        const stats = calculateUserStats(user.id);
                        return (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{stats.totalTransactions}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-emerald-600 text-right">
                              Rs.{stats.totalIncome.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right">
                              Rs.{stats.totalExpense.toFixed(2)}
                            </td>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                              stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              Rs.{stats.balance.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Transaction Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Income</p>
                  <p className="text-xl font-bold text-emerald-600">
                    Rs.{transactions
                      .filter(t => t.type === 'INCOME')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)
                    }
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Expense</p>
                  <p className="text-xl font-bold text-red-600">
                    Rs.{transactions
                      .filter(t => t.type === 'EXPENSE')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)
                    }
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Average Transaction</p>
                  <p className="text-xl font-bold text-gray-900">
                    Rs.{(transactions.reduce((sum, t) => sum + t.amount, 0) / (transactions.length || 1)).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                  <p className={`text-xl font-bold ${calculateTotalBalance() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Rs.{calculateTotalBalance().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
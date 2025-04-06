"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Activity, 
  TrendingDown, 
  Clock,
  User
} from "lucide-react";

interface Summary {
  totalTransactions: number;
  totalUsers: number;
  totalIncome: number;
  totalExpense: number;
}

interface RecentActivity {
  id: number;
  userName: string;
  action: string;
  createdAt: string;
}

interface UserSummary {
  userId: number;
  userName: string;
  income: number;
  expense: number;
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState<Summary>({
    totalTransactions: 0,
    totalUsers: 0,
    totalIncome: 0,
    totalExpense: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Simulate API calls - replace with actual API endpoints
      const [summaryRes, activitiesRes] = await Promise.all([
        fetch("/api/dashboard/summary"),
        fetch("/api/activity-logs?limit=5")
      ]);

      if (!summaryRes.ok || !activitiesRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const summaryData = await summaryRes.json();
      const activitiesData = await activitiesRes.json();

      setSummary({
        totalTransactions: summaryData.totalTransactions || 0,
        totalUsers: summaryData.totalUsers || 0,
        totalIncome: summaryData.totalIncome || 0,
        totalExpense: summaryData.totalExpenses || 0
      });
      
      setRecentActivities(activitiesData);
      
      // Set user summaries from the API response
      setUserSummaries(summaryData.userSummaries || []);
      
      setIsLoading(false);
    } catch {
      setError("Unable to load dashboard data");
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    switch(action.toLowerCase()) {
      case 'created': return 'text-green-600';
      case 'updated': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((_, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-md p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transactions Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Income & Expenses
            </h3>
            <span className="text-gray-500 text-sm">Total</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Income</span>
              </div>
              <span className="font-bold text-green-700">
                {formatCurrency(summary.totalIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Expense</span>
              </div>
              <span className="font-bold text-red-700">
                {formatCurrency(summary.totalExpense)}
              </span>
            </div>
            <div className="border-t pt-2 text-center">
              <span className="text-sm text-gray-600">
                Total Transactions: {summary.totalTransactions}
              </span>
            </div>
          </div>
        </div>

        {/* Users Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Users
            </h3>
            <span className="text-gray-500 text-sm">Total</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Registered Users</span>
            <span className="text-2xl font-bold text-green-700">
              {summary.totalUsers}
            </span>
          </div>
          <div className="border-t pt-2 text-center">
            <span className="text-sm text-gray-600">
              Active community growth
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h3>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <ul className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-center text-gray-500">No recent activities</p>
            ) : (
              recentActivities.map((activity) => (
                <li 
                  key={activity.id} 
                  className="flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {activity.userName}
                    </span>
                    <span 
                      className={`
                        ml-2 text-xs px-2 py-1 rounded-full
                        ${getActionColor(activity.action)} 
                        bg-opacity-10 
                        font-semibold
                      `}
                    >
                      {activity.action}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Admin Users Transaction Sections */}
      {userSummaries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Branches Income & Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userSummaries.map((user) => (
              <div 
                key={user.userId}
                className="bg-white rounded-xl shadow-md p-6 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    {user.userName}
                  </h3>
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                    ID: {user.userId}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Income</span>
                    </div>
                    <span className="font-medium text-green-700">
                      {formatCurrency(user.income)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-gray-700">Expense</span>
                    </div>
                    <span className="font-medium text-red-700">
                      {formatCurrency(user.expense)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance</span>
                      <span className={`font-bold ${user.income - user.expense >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(user.income - user.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
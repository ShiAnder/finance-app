import React from 'react';
import { PieChart, User, LogOut } from 'react-feather';

interface UserProps {
  name?: string;
}

interface DashboardHeaderProps {
  currentUser: UserProps | null;
  isAdmin: boolean;
  balance: number;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUser,
  isAdmin,
  balance,
  onLogout
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-3">
        <PieChart className="w-8 h-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">Current Balance:</span>
          <span className={`ml-2 text-xl font-semibold ${
            balance >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            Rs.{balance.toFixed(2)}
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
              onClick={onLogout}
              className="ml-2 p-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
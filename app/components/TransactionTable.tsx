import React, { useState } from 'react';
import { Edit, Trash2, ArrowUp, ArrowDown, Search } from 'react-feather';

// Ensure this interface matches the one in FinanceDashboard.tsx
export interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  isAdmin: boolean;
  currentUserId?: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isAdmin,
  currentUserId,
  onEdit,
  onDelete,
  pagination,
  onPageChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions
    .filter(transaction => isAdmin || transaction.userId === currentUserId)
    .filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {isAdmin ? 'All Transactions' : 'Your Transactions'}
        </h2>
      </div>

      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
            {filteredTransactions.map((transaction) => (
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
                  {(isAdmin || transaction.userId === currentUserId) && (
                    <>
                      <button 
                        onClick={() => onEdit(transaction)}
                        className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onDelete(transaction.id)}
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
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-500 text-gray-900"
            >
              Previous
            </button>
            <button 
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-500 text-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
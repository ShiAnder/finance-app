"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'react-feather';

const expenseCategories = [
  "Haven't Paid", "Groceries", "Water Bill", "Electricity", "Building Rental", 
  "Furnitures", "Glass and Crock", "Staff Salary", "Staff Service Charge"
];

const incomeCategories = [
  "Restaurant", "Surf Lessons", "Surf Board Rental", "Pending Payments Clear"
];

interface TransactionFormProps {
  initialData?: TransactionData;
  editingId?: number | null;
  onSubmit: (formData: TransactionData) => Promise<void>;
  isLoading: boolean;
}

export interface TransactionData {
  id?: number;
  amount: number;
  type: string;
  category: string;
  description: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData = { amount: 0, type: 'EXPENSE', category: '', description: '' },
  editingId,
  onSubmit,
  isLoading
}) => {
  // Default initial state for resetting
  const defaultInitialState = { 
    amount: 0, // Change from '' to 0
    type: 'EXPENSE', 
    category: '', 
    description: '' 
  };

  const [formData, setFormData] = useState(initialData);

  // Add useEffect to update form data when initialData changes
  useEffect(() => {
    if (editingId && initialData) {
      setFormData({
        ...initialData,
        amount: initialData.amount // Ensure amount is a string
      });
    }
  }, [editingId, initialData]);

  const getCategories = () => {
    switch (formData.type) {
      case "EXPENSE": return expenseCategories;
      case "INCOME": return incomeCategories;
      case "OTHER": return ["Other"];
      default: return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({
        ...formData,
        amount: formData.amount, // Ensure amount iss a number
        id: editingId ?? undefined, // Convert null to undefined
      });

      // Reset form to default state after successful submission
      setFormData(defaultInitialState);
    } catch (error) {
      console.error('Transaction submission failed', error);
    }
  };

  return (
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} // Convert to number
              required
            />
          </div>
          
          <div className="flex gap-4">
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

            <div className="w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="" disabled>Select a category</option>
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
  );
};
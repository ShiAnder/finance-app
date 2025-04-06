"use client";

import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'react-feather';

import { TransactionForm, TransactionData } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';
import { DashboardHeader } from '../components/DashboardHeader';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ErrorToast } from '../components/ErrorToast';

// Updated interfaces to match component expectations
interface User {
  id: number;
  name?: string;
  email?: string;
  role: 'USER' | 'ADMIN';
}

// Make sure this Transaction interface is compatible with the one in TransactionTable
interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number; // Changed from string to number to match TransactionTable
  category: string;
  description: string;
  date: string;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  const router = useRouter();

  // Use useCallback to memoize the fetchTransactions function
  const fetchTransactions = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions?page=${page}&pageSize=${pageSize}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const { transactions: fetchedTransactions, pagination: paginationData } = await res.json();
      
      // Ensure all transaction data is properly formatted
      const formattedTransactions = Array.isArray(fetchedTransactions) 
        ? fetchedTransactions.map(t => ({
            ...t,
            id: Number(t.id),
            userId: Number(t.userId),
            amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
            date: t.date || new Date().toISOString()
          }))
        : [];
      
      setTransactions(formattedTransactions);
      setPagination({
        currentPage: paginationData.currentPage,
        pageSize: paginationData.pageSize,
        totalItems: paginationData.totalItems,
        totalPages: paginationData.totalPages
      });
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch transactions');
      setTransactions([]);
      setPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
        setErrorMessage(error instanceof Error ? error.message : 'Authentication error');
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser, fetchTransactions]);

  const calculateBalance = (): number => {
    const filteredTransactions = isAdmin 
      ? transactions 
      : transactions.filter(t => t.userId === currentUser?.id);
      
    return filteredTransactions.reduce((acc, transaction) => {
      // Use number directly
      const amount = transaction.amount;
      // Assuming 'type' now includes 'INCOME', 'EXPENSE', etc.
      if (['INCOME', 'OTHER'].includes(transaction.type)) 
        return acc + amount;
      return acc - amount;
    }, 0);
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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTransaction = async (formData: TransactionData) => {
    try {
      setIsLoading(true);
      
      // Make sure userId is defined
      const dataToSubmit = {
        ...formData,
        userId: formData.id || currentUser?.id || 0
      };
      
      const url = formData.id ? `/api/transactions/${formData.id}` : '/api/transactions';
      const method = formData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Transaction failed');
      }
      
      fetchTransactions();
      setEditingTransaction(null);
    } catch (error) {
      console.error('Submit transaction error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!isAdmin && transaction?.userId !== currentUser?.id) {
        setErrorMessage("You don't have permission to delete this transaction");
        return;
      }
      
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Delete failed');
      }
      
      fetchTransactions();
    } catch (error) {
      console.error('Delete transaction error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (

    <>
    <Head>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6339178599523298"
        crossOrigin="anonymous"
      ></script>
    </Head>


    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin">
            <Loader className="w-10 h-10 md:w-12 md:h-12 text-emerald-600" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            handleDelete(deleteCandidate);
            setDeleteCandidate(null);
          }
        }}
      />

      {/* Error Toast - Fixed to remove className prop */}
      <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        {errorMessage && (
          <ErrorToast 
            message={errorMessage} 
            onClose={() => setErrorMessage(null)} 
          />
        )}
      </div>

      <div className={`w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 ${isLoading ? 'blur-sm' : ''}`}>
        {/* Dashboard Header */}
        <DashboardHeader
          currentUser={currentUser}
          isAdmin={isAdmin}
          balance={calculateBalance()}
          onLogout={handleLogout}
        />

        {/* Main content container with improved mobile layout */}
        <div className="mt-4 md:mt-8 space-y-4 md:space-y-8">
          {/* Transaction Form */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-medium text-gray-800 mb-3 md:mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <TransactionForm
              initialData={
                editingTransaction
                  ? { ...editingTransaction, amount: editingTransaction.amount }
                  : undefined
              }
              editingId={editingTransaction?.id}
              onSubmit={handleSubmitTransaction}
              isLoading={isLoading}
            />
          </div>

          {/* Transaction Table */}
          <div className="bg-white shadow rounded-lg p-3 md:p-6 overflow-hidden">
            <h2 className="text-lg md:text-xl font-medium text-gray-800 mb-3 md:mb-4">Transactions</h2>
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <TransactionTable
                  transactions={transactions}
                  isAdmin={isAdmin}
                  currentUserId={currentUser.id}
                  onEdit={(transaction) => {
                    if (!isAdmin && transaction.userId !== currentUser.id) {
                      setErrorMessage("You don't have permission to edit this transaction");
                      return;
                    }
                    setEditingTransaction(transaction);
                    // Scroll to the form when editing on mobile
                    if (window.innerWidth < 768) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onDelete={(id) => setDeleteCandidate(id)}
                  pagination={pagination}
                  onPageChange={fetchTransactions}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
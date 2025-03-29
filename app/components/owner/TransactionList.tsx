import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface Transaction {
  id: number;
  userId: number;
  user?: User;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Define the categories by type
  const expenseCategories = [
    "Groceries", 
    "Water Bill", 
    "Electricity", 
    "Building Rental", 
    "Furnitures", 
    "Glass and Crock", 
    "Staff Salary", 
    "Staff Service Charge"
  ];
  
  const incomeCategories = [
    "Restaurant", 
    "Surf Lessons", 
    "Surf Board Rental"
  ];

  // Get categories based on selected type
  const getFilterCategories = () => {
    if (selectedType === "EXPENSE") return expenseCategories;
    if (selectedType === "INCOME") return incomeCategories;
    if (selectedType === "all") return [...expenseCategories, ...incomeCategories, "Other"];
    return ["Other"];
  };

  // Fetch users for the dropdown
  const fetchUsers = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) throw new Error("Failed to fetch session");

      const sessionData = await sessionResponse.json();
      if (!sessionData?.user || sessionData.user.role !== "OWNER") {
        return; // Only owners can see all users
      }

      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data); // Adjust based on your API response structure
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTransactions = async (
    page = 1,
    category = "all",
    type = "all",
    userId = "all",
    startDate?: string,
    endDate?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) throw new Error("Failed to fetch session");

      const sessionData = await sessionResponse.json();
      if (!sessionData?.user) throw new Error("No active session");

      const currentUserId = sessionData.user.id ? sessionData.user.id.toString() : "1";
      const userRole = sessionData.user.role || "USER";

      const url = new URL("/api/transactions", window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", "10");
      url.searchParams.set("category", category);
      url.searchParams.set("type", type);
      
      if (userRole === "OWNER" && userId !== "all") {
        url.searchParams.set("userId", userId);
      }

      if (startDate) url.searchParams.set("startDate", startDate);
      if (endDate) url.searchParams.set("endDate", endDate);

      const response = await fetch(url.toString(), {
        headers: {
          "x-user-id": currentUserId,
          "x-user-role": userRole
        }
      });

      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchTransactions(
      newPage, 
      selectedCategory, 
      selectedType, 
      selectedUser, 
      startDate, 
      endDate
    );
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    // Reset category when type changes
    setSelectedCategory("all");
  };

  const handleDownload = () => {
    const url = new URL("/api/transactions/export", window.location.origin);
    url.searchParams.set("category", selectedCategory);
    url.searchParams.set("type", selectedType);
    
    if (selectedUser !== "all") {
      url.searchParams.set("userId", selectedUser);
    }
    
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    
    window.location.href = url.toString();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTransactions(
      1, 
      selectedCategory, 
      selectedType, 
      selectedUser, 
      startDate, 
      endDate
    );
  }, [selectedCategory, selectedType, selectedUser, startDate, endDate]);

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="space-y-4 w-full">
              <div className="flex flex-wrap gap-4">
                {/* Type filter */}
                <Select 
                  value={selectedType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category filter - dynamic based on selected type */}
                <Select 
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value)}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getFilterCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User filter (for owner role only) */}
                {users.length > 0 && (
                  <Select 
                    value={selectedUser}
                    onValueChange={(value) => setSelectedUser(value)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Date range filters */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36 border rounded p-2"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36 border rounded p-2"
                  />
                </div>

                <Button 
                  onClick={handleDownload} 
                  className="ml-auto flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center py-8">Loading transactions...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-8">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No transactions found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 border">Date</th>
                      <th className="py-3 px-6 border">User</th>
                      <th className="py-3 px-6 border">Type</th>
                      <th className="py-3 px-6 border">Category</th>
                      <th className="py-3 px-6 border">Description</th>
                      <th className="py-3 px-6 border text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="text-gray-700 text-sm border hover:bg-gray-50">
                        <td className="py-3 px-6 border">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="py-3 px-6 border">{transaction.user?.name || "-"}</td>
                        <td className="py-3 px-6 border">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'INCOME' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.type === 'EXPENSE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-6 border">{transaction.category}</td>
                        <td className="py-3 px-6 border">{transaction.description}</td>
                        <td className="py-3 px-6 border text-right font-medium">
                          <span className={transaction.type === 'INCOME' ? 'text-green-600' : transaction.type === 'EXPENSE' ? 'text-red-600' : ''}>
                            ${transaction.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
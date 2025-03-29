"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Trash2, 
  UserCircle, 
  Mail,
  AlertCircle, 
  MoreHorizontal 
} from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setErrorMessage(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await fetch(`/api/users/${userId}`, { method: "DELETE" });
      setUsers(users.filter((user) => user.id !== userId));
      setSelectedUser(null);
    } catch {
      setErrorMessage("Failed to delete user");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-700 flex items-center gap-2">
          <Users className="w-6 h-6" />
          User Management
        </h2>
      </div>

      {/* Error Handling */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center text-red-700">
          <AlertCircle className="mr-3 w-6 h-6" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* User List */}
          <div className="space-y-3">
            {users.map((user) => (
              <div 
                key={user.id} 
                className="
                  flex items-center justify-between 
                  bg-white border border-gray-100 
                  rounded-lg p-4 shadow-sm 
                  hover:shadow-md transition-all
                  relative
                "
              >
                <div className="flex items-center space-x-4">
                  <UserCircle className="w-10 h-10 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Role Badge */}
                  <span 
                    className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${getRoleColor(user.role)}
                    `}
                  >
                    {user.role}
                  </span>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <MoreHorizontal />
                    </button>

                    {selectedUser === user.id && (
                      <div 
                        className="
                          absolute right-0 top-full mt-2 
                          bg-white border rounded-lg shadow-lg
                          z-10 w-40
                        "
                      >
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="
                            flex items-center w-full p-2 
                            text-red-600 hover:bg-red-50
                            text-sm
                          "
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Users State */}
          {!isLoading && users.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  LogOut, 
  AlertCircle,
} from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AuthHandler() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        throw new Error("Unauthorized");
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setError(null);
    } catch {
      setError("Session expired. Please log in.");
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Now fetchUser is memoized with useCallback

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setError("Logout failed. Please try again.");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center text-red-700">
        <AlertCircle className="mr-3 w-6 h-6" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end">
          {currentUser && (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="
                  flex items-center space-x-2 
                  bg-white border border-gray-200 
                  rounded-full px-4 py-2 
                  hover:bg-gray-100
                  transition-colors
                "
              >
                <User className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-gray-700">
                  {currentUser.name}
                </span>
                <span 
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${getRoleBadgeColor(currentUser.role)}
                  `}
                >
                  {currentUser.role}
                </span>
              </button>

              {isDropdownOpen && (
                <div 
                  className="
                    absolute right-0 mt-2 
                    bg-white border border-gray-200 
                    rounded-lg shadow-lg
                    w-64 z-20
                  "
                >
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">
                      {currentUser.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentUser.email}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="
                        flex items-center w-full px-4 py-2 
                        text-red-600 hover:bg-red-50
                        text-sm
                      "
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click-outside handler for dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

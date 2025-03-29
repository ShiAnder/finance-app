"use client";

import { useState } from "react";
import { 
  LayoutGrid, 
  Users, 
  CreditCard, 
  Activity, 
  Menu, 
  X,
  Home 
} from "lucide-react";
import UserList from "../owner/UserList";
import TransactionList from "../owner/TransactionList";
import ActivityLog from "../owner/ActivityLog";
import DashboardOverview from "../owner/DashboardOverview";
import AuthHandler from "../owner/AuthHandler";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: Home 
    },
    { 
      id: "users", 
      label: "Users", 
      icon: Users 
    },
    { 
      id: "transactions", 
      label: "Transactions", 
      icon: CreditCard 
    },
    { 
      id: "activity", 
      label: "Activity Logs", 
      icon: Activity 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <AuthHandler />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden flex justify-between items-center bg-white rounded-xl shadow-md p-4 mb-4">
          <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" />
            Dashboard
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-indigo-600"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-xl shadow-md mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-start p-4 border-b last:border-b-0 ${
                  activeTab === tab.id 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="mr-3 w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:flex justify-between items-center bg-white p-4 shadow-md rounded-xl mb-6">
          <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-3">
            <LayoutGrid className="w-7 h-7" />
            Dashboard
          </h1>
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`
                  flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 
                  ${
                    activeTab === tab.id
                      ? "bg-indigo-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content with Smooth Transition */}
        <div 
          className="bg-white rounded-xl shadow-md overflow-hidden 
          transition-all duration-500 ease-in-out transform"
        >
          <div className="p-4 md:p-6">
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "users" && <UserList />}
            {activeTab === "transactions" && <TransactionList />}
            {activeTab === "activity" && <ActivityLog />}
          </div>
        </div>
      </div>
    </div>
  );
}
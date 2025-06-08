import React, { useState } from "react";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { FileText, Calendar, History, Upload } from "lucide-react";
import UploadAndPrint from "./UploadAndPrint";
import BookSlot from "./BookSlot";
import HistoryComponent from "./History";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("uploadAndPrint");

  const renderSection = () => {
    switch (activeSection) {
      case "uploadAndPrint":
        return <UploadAndPrint />;
      case "bookSlot":
        return <BookSlot />;
      case "history":
        return <HistoryComponent />;
      default:
        return <UploadAndPrint />;
    }
  };

  const navItems = [
    { id: "uploadAndPrint", label: "Upload & Print", icon: Upload },
    { id: "bookSlot", label: "Book Slot", icon: Calendar },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/40 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PrintEase
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/60"
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User Button */}
            <SignedIn>
              <div className="flex items-center">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-indigo-300 hover:ring-indigo-600 transition-all duration-200"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white/60 backdrop-blur-sm border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/60"
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in duration-500">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
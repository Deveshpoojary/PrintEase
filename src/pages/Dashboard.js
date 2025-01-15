import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadAndPrint from "./UploadAndPrint";
import BookSlot from "./BookSlot";
import History from "./History";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("uploadAndPrint");
  const navigate = useNavigate();

  const renderSection = () => {
    switch (activeSection) {
      case "uploadAndPrint":
        return <UploadAndPrint />;
      case "bookSlot":
        return <BookSlot />;
      case "history":
        return <History />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <h1 className="text-xl font-bold flex-1">Dashboard</h1>
        <nav className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              activeSection === "uploadAndPrint"
                ? "bg-blue-800"
                : "bg-blue-500 hover:bg-blue-700"
            }`}
            onClick={() => setActiveSection("uploadAndPrint")}
          >
            Upload & Print
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeSection === "bookSlot"
                ? "bg-blue-800"
                : "bg-blue-500 hover:bg-blue-700"
            }`}
            onClick={() => setActiveSection("bookSlot")}
          >
            Book Slot
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeSection === "history"
                ? "bg-blue-800"
                : "bg-blue-500 hover:bg-blue-700"
            }`}
            onClick={() => setActiveSection("history")}
          >
            History
          </button>
          <button
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            onClick={() => navigate("/")}
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="p-6">{renderSection()}</main>
    </div>
  );
};

export default Dashboard;

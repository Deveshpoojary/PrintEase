import React, { useState } from "react";
import Sidebar from "./Sidebar";
import SubmittedFiles from "./SubmittedFiles";
import SlotBooking from "./SlotBooking";
import DashboardContent from "./DashboardContent"; // Dashboard section content component

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard"); // To manage active section

  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar component */}
      <Sidebar onSectionChange={handleSectionChange} />

      <div className="flex-1 ml-64"> {/* Sidebar width added as margin */}
        <div className="container mx-auto px-4 py-8">
          {/* Dynamic content based on active section */}
          {activeSection === "dashboard" && <DashboardContent />}
          {activeSection === "submittedFiles" && <SubmittedFiles />}
          {activeSection === "slotBooking" && <SlotBooking />}
        </div>
      </div>
    </div>
  );
}

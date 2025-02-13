import { Home, Calendar, FileText } from "lucide-react";

export default function Sidebar({ onSectionChange }) {
  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transition duration-200 ease-in-out">
      <button 
        onClick={() => onSectionChange("dashboard")}
        className="text-white flex items-center space-x-2 px-4"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 17L17 7M17 7H8M17 7V16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-2xl font-extrabold">Admin Panel</span>
      </button>
      
      <nav>
        <button
          onClick={() => onSectionChange("dashboard")}
          className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white w-full text-left"
        >
          <Home className="inline-block mr-2" size={20} />
          Dashboard
        </button>

        <button
          onClick={() => onSectionChange("submittedFiles")}
          className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white w-full text-left"
        >
          <FileText className="inline-block mr-2" size={20} />
          Submitted Files
        </button>

        <button
          onClick={() => onSectionChange("slotBooking")}
          className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white w-full text-left"
        >
          <Calendar className="inline-block mr-2" size={20} />
          Slot Booking
        </button>
      </nav>
    </div>
  );
}

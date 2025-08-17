import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  Printer,
  Clock,
  X,
} from "lucide-react";

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyData, setHistoryData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/print-request/user-history?email=${user.primaryEmailAddress.emailAddress}`
        );
        const data = await res.json();
        setHistoryData(data.printHistory || []);
        setBookingData(data.bookings || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Download className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredHistory = historyData.filter((item) => {
    const fileNameMatch = Array.isArray(item.file_url)
      ? item.file_url.join(" ").toLowerCase()
      : (item.file_url || "").toLowerCase();
    return (
      fileNameMatch.includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || item.status === statusFilter)
    );
  });

  const parseFileUrls = (file_url) => {
    try {
      if (typeof file_url === "string") {
        const parsed = JSON.parse(file_url);
        if (Array.isArray(parsed)) return parsed;
        return Object.values(parsed);
      } else if (Array.isArray(file_url)) {
        return file_url;
      } else {
        return [file_url];
      }
    } catch (err) {
      return file_url?.split(",") || [];
    }
  };

  const isImage = (filename) =>
    /\.(jpe?g|png|gif|webp|bmp)$/i.test(filename.toLowerCase());

  const isPdf = (filename) => /\.pdf$/i.test(filename.toLowerCase());

  return (
    <div id="history" className="space-y-12">
      {/* --- Print History Section --- */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Print History
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Track and manage all your printing requests
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/60 text-gray-800"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-gray-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white/60 text-gray-800"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print Request Cards */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedRequest(item)}
            className="cursor-pointer bg-white/80 p-6 rounded-2xl border border-white/40 shadow-lg hover:scale-[1.01] transition-transform"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {parseFileUrls(item.file_url)
                      .map((url) => url.split("/").pop())
                      .join(", ")}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{item.pages} pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>{item.copies} copies</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(
                    item.status
                  )}`}
                >
                  {getStatusIcon(item.status)}
                  <span className="capitalize">{item.status}</span>
                </div>
                <div className="text-gray-800 font-semibold">
                  ₹{item.price || "0.00"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Slot Bookings Section --- */}
      <div className="text-center space-y-4 mt-12">
        <h2 className="text-3xl font-bold text-purple-600">Your Slot Bookings</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          View your scheduled booking slots
        </p>
      </div>
      <div className="space-y-4">
        {bookingData.length === 0 && (
          <p className="text-center text-gray-500">No bookings found.</p>
        )}
        {bookingData.map((booking) => {
  const startTime = new Date(booking.start_at);
  const endTime = new Date(
    startTime.getTime() + booking.duration_minutes * 60000
  );

  const getBookingStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div
  key={booking.booking_id}
  className="bg-white/80 p-6 rounded-2xl border border-white/40 shadow-lg"
>
  <div className="flex flex-col md:flex-row md:justify-between">
    <div>
      <p className="font-semibold text-gray-800">
        Slot: {startTime.toLocaleDateString()}{" "}
        {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
        {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      {booking.notes && (
        <p className="text-sm text-gray-500 mt-2">Notes: {booking.notes}</p>
      )}

      {/* ✅ Display OTP */}
      {booking.otp && (
        <p className="text-sm text-purple-600 font-semibold mt-2">
          OTP: {booking.otp}
        </p>
      )}
    </div>
    <div className="text-sm text-gray-500 mt-2 md:mt-0">
      Booked on: {new Date(booking.booking_created_at).toLocaleString()}
    </div>
    <div>
      {booking.status && (
        <div
          className={`inline-flex mt-2 items-center px-3 py-1 rounded-lg text-sm font-medium border ${getBookingStatusColor(
            booking.status
          )}`}
        >
          {booking.status}
        </div>
      )}
    </div>
  </div>
</div>

  );
})}

      </div>

      {/* Modal for Print Request */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-3 right-3 bg-red-100 text-red-600 px-3 py-1 rounded-xl hover:bg-red-200"
            >
              Close
            </button>

            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              Request Details
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {selectedRequest.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedRequest.email}
              </p>
              <p>
                <strong>Pages:</strong> {selectedRequest.pages}
              </p>
              <p>
                <strong>Copies:</strong> {selectedRequest.copies}
              </p>
              <p>
                <strong>Color:</strong> {selectedRequest.color}
              </p>
              <p>
                <strong>Sides:</strong> {selectedRequest.sides}
              </p>
              {selectedRequest.specific_pages && (
                <p>
                  <strong>Specific Pages:</strong>{" "}
                  {selectedRequest.specific_pages}
                </p>
              )}
              {selectedRequest.comments && (
                <p>
                  <strong>Comments:</strong> {selectedRequest.comments}
                </p>
              )}
              <p>
                <strong>Status:</strong> {selectedRequest.status}
              </p>
              <p>
                <strong>Cost:</strong> ₹{selectedRequest.price || 0}
              </p>
            </div>

            <h3 className="mt-6 mb-2 text-lg font-semibold text-indigo-600">
              Files:
            </h3>
            <div className="space-y-6">
              {parseFileUrls(selectedRequest.file_url).map((file, index) => {
                const fileUrl = file.trim();
                return (
                  <div
                    key={index}
                    className="border rounded-xl overflow-hidden bg-gray-50"
                  >
                    <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-800">
                      {fileUrl.split("/").pop()}
                    </div>
                    {isImage(fileUrl) ? (
                      <img
                        src={fileUrl}
                        alt="Uploaded file"
                        className="w-full max-h-[500px] object-contain"
                      />
                    ) : isPdf(fileUrl) ? (
                      <iframe
                        title={`file-preview-${index}`}
                        src={`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
                          fileUrl
                        )}&embedded=true`}
                        className="w-full h-96"
                        frameBorder="0"
                      />
                    ) : (
                      <p className="p-4 text-sm text-red-600">
                        Unsupported file type.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;

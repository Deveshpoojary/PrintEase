import React, { useEffect, useState } from "react";
import { Calendar, Clock, User, CheckCircle, Search } from "lucide-react";

const BookingSlots = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [otpInputs, setOtpInputs] = useState({}); // track otp per booking

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("https://print-ease-backend-gold.vercel.app/api/admin/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const formatLocalDate = (value) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));

  const formatLocalTime = (value) =>
    new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const handleOtpChange = (id, value) => {
    setOtpInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleComplete = async (id, otp) => {
    if (!otp) return alert("Enter OTP");
    try {
      const res = await fetch("https://print-ease-backend-gold.vercel.app/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Booking marked as completed ✅");
        fetchBookings(); // refresh list
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("Failed to complete booking:", err);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      (b.usn && b.usn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Bookings
      </h2>

      {/* 🔍 Search Bar */}
      <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl shadow">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, email, or USN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none bg-transparent"
        />
      </div>

      <div className="grid gap-4">
        {filteredBookings.map((booking) => (
          <div
            key={booking.booking_id}
            className="p-5 bg-white/80 rounded-xl shadow space-y-3"
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" /> {booking.name} ({booking.email})
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />{" "}
                  {formatLocalDate(booking.start_at)}
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />{" "}
                  {(() => {
                    const start = new Date(booking.start_at);
                    const end = new Date(start.getTime() + booking.duration_minutes * 60000);
                    return `${formatLocalTime(start)} - ${formatLocalTime(end)}`;
                  })()}
                </p>
                {booking.otp && (
                  <p className="text-sm text-purple-700 font-semibold">OTP: {booking.otp}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    booking.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : booking.status === "checked_in"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {booking.status}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs">
                  10 min slot
                </span>

                {/* ✅ OTP Input + Button (if not completed yet) */}
                {booking.status !== "completed" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otpInputs[booking.booking_id] || ""}
                      onChange={(e) =>
                        handleOtpChange(booking.booking_id, e.target.value)
                      }
                      className="border rounded-lg px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() =>
                        handleComplete(
                          booking.booking_id,
                          otpInputs[booking.booking_id]
                        )
                      }
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                    >
                      Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingSlots;

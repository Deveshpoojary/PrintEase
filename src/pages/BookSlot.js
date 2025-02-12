import React, { useState } from "react";

const BookSlot = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [userName, setUserName] = useState("");
  const [usn, setUsn] = useState("");
  const [availableSlots, setAvailableSlots] = useState([
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
  ]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [showBookings, setShowBookings] = useState(false);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime("");
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !userName || !usn) {
      alert("Please fill out all fields.");
      return;
    }

    if (bookedSlots.some((slot) => slot.date === selectedDate && slot.time === selectedTime)) {
      alert("This slot is already booked. Please choose another.");
      return;
    }

    const newBooking = {
      date: selectedDate,
      time: selectedTime,
      name: userName,
      usn,
    };

    setBookedSlots([...bookedSlots, newBooking]);
    setConfirmationMessage(
      `Booking confirmed for ${selectedDate} at ${selectedTime} for ${userName} (USN: ${usn}).`
    );

    setSelectedDate("");
    setSelectedTime("");
    setUserName("");
    setUsn("");
  };

  const handleDeleteBooking = (index) => {
    const updatedBookings = bookedSlots.filter((_, i) => i !== index);
    setBookedSlots(updatedBookings);
  };

  const availableTimes = availableSlots.filter(
    (slot) => !bookedSlots.some((booked) => booked.date === selectedDate && booked.time === slot)
  );

  return (
    <div className="container mx-auto p-6 relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowBookings(!showBookings)}
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          {showBookings ? "Hide My Bookings" : "My Bookings"}
        </button>
      </div>
      <h2 className="text-3xl font-bold mb-6 text-center">Book Slot</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="mb-4">
          <label className="block mb-2 font-bold">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border p-2 w-full rounded"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold">Select Time</label>
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="border p-2 w-full rounded"
            disabled={!selectedDate}
          >
            <option value="">Select a time</option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold">Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold">Your USN</label>
          <input
            type="text"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Enter your USN number"
          />
        </div>
        <button
          onClick={handleBooking}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
        >
          Confirm Booking
        </button>
        {confirmationMessage && (
          <p className="mt-4 text-green-600 font-bold text-center">{confirmationMessage}</p>
        )}
      </div>
      {showBookings && (
        <div className="fixed right-0 w-80 bg-white p-6 shadow-lg overflow-auto transition-transform transform translate-x-0"
             style={{ top: "5rem", height: "calc(100% - 4rem)" }}>
          <button
            onClick={() => setShowBookings(false)}
            className="absolute top-2 right-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Close
          </button>
          <h3 className="text-xl font-bold mb-4">My Bookings</h3>
          {bookedSlots.length > 0 ? (
            <ul>
              {bookedSlots.map((booking, index) => (
                <li key={index} className="border-b p-2 flex justify-between items-center">
                  <span>{booking.name} (USN: {booking.usn}) - {booking.date} at {booking.time}</span>
                  <button
                    onClick={() => handleDeleteBooking(index)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No bookings available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BookSlot;
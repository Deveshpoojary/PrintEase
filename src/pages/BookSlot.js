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

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime(""); // Reset selected time when date changes
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !userName || !usn) {
      alert("Please fill out all fields.");
      return;
    }

    // Check if slot is already booked
    if (bookedSlots.some((slot) => slot.date === selectedDate && slot.time === selectedTime)) {
      alert("This slot is already booked. Please choose another.");
      return;
    }

    // Save the booking (you can replace this with a backend call)
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

    // Clear inputs
    setSelectedDate("");
    setSelectedTime("");
    setUserName("");
    setUsn("");
  };

  const availableTimes = availableSlots.filter(
    (slot) => !bookedSlots.some((booked) => booked.date === selectedDate && booked.time === slot)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Book Slot</h2>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <div className="mb-4">
          <label className="block mb-2 font-bold">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold">Select Time</label>
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="border p-2 w-full"
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
            className="border p-2 w-full"
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold">Your USN</label>
          <input
            type="text"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            className="border p-2 w-full"
            placeholder="Enter your USN number"
          />
        </div>
        <button
          onClick={handleBooking}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Confirm Booking
        </button>
        {confirmationMessage && (
          <p className="mt-4 text-green-600 font-bold">{confirmationMessage}</p>
        )}
      </div>
    </div>
  );
};

export default BookSlot;

import React, { useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';

const BookSlot = () => {
  const [booking, setBooking] = useState({
    date: '',
    time: '',
    name: '',
    usn: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const handleInputChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const isFormValid = booking.date && booking.time && booking.name && booking.email && booking.usn;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Book Printing Slot
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Reserve your printing time slot to ensure quick and hassle-free service
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date & Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Select Date</h3>
              </div>
              <input
                type="date"
                name="date"
                value={booking.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Select Time</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBooking({ ...booking, time: slot })}
                    className={`px-4 py-3 rounded-xl font-medium ${
                      booking.time === slot
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80 hover:text-gray-800 border border-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-gray-700 font-medium">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={booking.name}
                  onChange={handleInputChange}
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-700 font-medium">USN *</label>
                <input
                  type="text"
                  name="usn"
                  value={booking.usn}
                  onChange={handleInputChange}
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your USN"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-700 font-medium">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={booking.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-700 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={booking.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <label className="block text-gray-700 font-medium">Additional Notes (Optional)</label>
            <textarea
              name="notes"
              value={booking.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 resize-none"
              placeholder="Any special requirements or notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col items-center space-y-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              Book Printing Slot
            </button>

            {isSubmitted && (
              <div className="px-6 py-3 bg-green-100 text-green-700 border border-green-200 rounded-xl font-medium">
                Slot booked successfully! You'll receive a confirmation email shortly.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookSlot;

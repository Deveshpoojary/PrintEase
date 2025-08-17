import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const API_BASE = 'http://localhost:5000';

const BookSlot = () => {
  const { user } = useUser();

  const [booking, setBooking] = useState({
    date: '',
    time: '',
    usn: '',
    phone: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [remaining, setRemaining] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [otp, setOtp] = useState('');

  const isFormValid = booking.date && booking.time && booking.usn && booking.phone;

  const handleInputChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
    setSuccessMsg('');
    setErrorMsg('');
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      setRemaining(null);
      setCapacity(null);
      setOtp('');
      if (!booking.date || !booking.time) return;
      try {
        const qs = new URLSearchParams({ date: booking.date, time: booking.time }).toString();
        const res = await fetch(`${API_BASE}/api/slots/availability?${qs}`);
        const data = await res.json();
        if (res.ok) {
          setRemaining(data.remaining);
          setCapacity(data.capacity);
        } else {
          setErrorMsg(data.error || 'Failed to load availability');
        }
      } catch {
        setErrorMsg('Failed to load availability');
      }
    };
    fetchAvailability();
  }, [booking.date, booking.time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    setOtp('');

    try {
      const payload = {
        ...booking,
        // inject from Clerk
        email: user.primaryEmailAddress.emailAddress,
        name: user.fullName || user.username || 'Unknown',
      };

      const res = await fetch(`${API_BASE}/api/book-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSuccessMsg(`Slot booked! Your check-in OTP is ${data.otp}.`);
      setOtp(data.otp);
      setRemaining(data.remaining);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <input
                type="time"
                name="time"
                value={booking.time}
                onChange={handleInputChange}
                step={600}
                className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              {booking.date && booking.time && (
                <div className="text-sm">
                  {remaining === null ? (
                    <span className="text-gray-500">Checking availability…</span>
                  ) : remaining > 0 ? (
                    <span className="text-green-600">
                      Seats available: {remaining}
                      {capacity !== null ? ` / ${capacity}` : ''}
                    </span>
                  ) : (
                    <span className="text-red-600">This slot is full. Pick another time.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Info (USN + Phone only, name/email auto from Clerk) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Your Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              disabled={!isFormValid || remaining === 0}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              Book Printing Slot
            </button>

            {successMsg && (
              <div className="px-6 py-3 bg-green-100 text-green-700 border border-green-200 rounded-xl font-medium">
                {successMsg}
              </div>
            )}
            {otp && (
              <div className="px-6 py-3 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-mono">
                Your OTP: <strong>{otp}</strong>
              </div>
            )}
            {errorMsg && (
              <div className="px-6 py-3 bg-red-100 text-red-700 border border-red-200 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookSlot;

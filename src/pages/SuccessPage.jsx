import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session_id"); // legacy (Stripe)
  const orderId = searchParams.get("orderId"); // used as txnid for PayU

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!orderId) {
          setError("Missing orderId");
          return;
        }

        // Auto-complete order in database
        await fetch(`https://print-ease-backend-gold.vercel.app/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });

        const orderRes = await fetch(`https://print-ease-backend-gold.vercel.app/api/orders/${orderId}`);
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Order fetch failed");

        setOrderDetails(orderData);
      } catch (err) {
        console.error("Error loading success page:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, orderId]);

  if (loading) return <div className="text-white text-center mt-10">Loading your order...</div>;
  if (error) return <div className="text-red-400 text-center mt-10">Error: {error}</div>;
  if (!orderDetails) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12">
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center">🎉 Payment Successful!</h1>
        <div className="bg-gray-800 p-6 rounded-xl space-y-4">
          <div><span className="font-semibold text-purple-300">Order ID:</span> {orderDetails.order_id}</div>
          <div><span className="font-semibold text-purple-300">Name:</span> {orderDetails.user_name}</div>
          <div><span className="font-semibold text-purple-300">Email:</span> {orderDetails.user_email}</div>
          <div><span className="font-semibold text-purple-300">Total Paid:</span> ₹{orderDetails.amount}</div>
          <div><span className="font-semibold text-purple-300">Order Time:</span> {new Date(orderDetails.created_at).toLocaleString()}</div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link to="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition">Go to Home</Link>
          <Link to="/dashboard?section=history" className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl transition">View Order History</Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;

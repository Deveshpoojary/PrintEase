import React, { useEffect, useState } from 'react';

const AdminSettings = () => {
  const [form, setForm] = useState({
    single_side_cost: '',
    double_side_cost: '',
    color_cost: ''
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/settings')
      .then(res => res.json())
      .then(data => setForm(data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text mb-6">
        Admin Print Pricing
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md border border-purple-200">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Single Side (B&W) Cost</label>
          <input
            type="number"
            name="single_side_cost"
            value={form.single_side_cost}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Double Side Cost</label>
          <input
            type="number"
            name="double_side_cost"
            value={form.double_side_cost}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Color Print Cost</label>
          <input
            type="number"
            name="color_cost"
            value={form.color_cost}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;

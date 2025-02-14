import React, { useState } from "react";

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [usn, setUsn] = useState("");
    const [password, setPassword] = useState("");

    const usnOptions = ["2024MCA081", "2024MCA008", "2024MCA018", "2024MCA021"]; // Example USNs

    const handleSignUp = (e) => {
        e.preventDefault();
        alert(`Signed up as ${name} (USN: ${usn})`);
    };

    return (
        <div className="flex items-center justify-center min-h-screen  bg-cyan-500 ">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Sign Up</h2>
                <form onSubmit={handleSignUp}>
                    <div className="mb-4 text-left">
                        <label className="block text-gray-600 font-semibold mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <div className="mb-4 text-left">
                        <label className="block text-gray-600 font-semibold mb-1">USN</label>
                        <select
                            value={usn}
                            onChange={(e) => setUsn(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="" disabled>Select your USN</option>
                            {usnOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-gray-600 font-semibold mb-1">Create Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-bold"
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;

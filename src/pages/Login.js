import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const LoginPage = () => {
    const [name, setName] = useState("");
    const [usn, setUsn] = useState("");
    const [password, setPassword] = useState("");
 
    const navigate=useNavigate();
    const handleLogin = (e) => {
        e.preventDefault();
        if (usn=="2024MCA081" && password=="0011" ) {
            localStorage.setItem("USN",usn);
            navigate("/dashboard");
        }else
        {
            alert("Invalid Credential.")
            
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-cyan-500">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Login</h2>
                <form onSubmit={handleLogin}>
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
                        <input
                            type="text"
                            value={usn}
                            onChange={(e) => setUsn(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your USN (eg : 2024MCA081)"
                            required
                        />
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-gray-600 font-semibold mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your password (eg : 0011 )"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-bold"
                    >
                        Login
                    </button>
                    <div className="">
                    Don't have an account? Sign up using your USN <span onClick={()=>navigate("/sign-up")} className="text-blue-800 cursor-pointer">here</span>!
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

import './App.css';
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./components/Main";
import Dashboard from "./pages/Dashboard";
import NotFoundPage from './components/NotFounPage';
import AdminDashboard from './admin/AdminDashboard';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Signup';


function App() {
  return (
    <>
     
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="*" element={<NotFounPage/>}/>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/sign-up' element={<SignUpPage/>}/>

      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

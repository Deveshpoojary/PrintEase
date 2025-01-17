import './App.css';
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./components/Main";
import Dashboard from "./pages/Dashboard";
import NotFoundPage from './components/NotFounPage';

function App() {
  return (
    <>
     
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="*" element={<NotFoundPage/>}/>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

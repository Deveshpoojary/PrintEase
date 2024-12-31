import './App.css';
import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Footer from "./components/Footer";

function App() {
  return (
    <>
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <Hero />
      <Services />
      <Footer />
    </div>
    </>
  );
}

export default App;

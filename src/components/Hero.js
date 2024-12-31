import React from "react";

const Hero = () => {
  return (
    <section className="bg-white py-20 text-center">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-4">Welcome to PrintEase</h2>
        <p className="text-gray-700 mb-6">Quick and Easy Printing Services for Your College Needs</p>
        <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Get Started</button>
      </div>
    </section>
  );
};

export default Hero;
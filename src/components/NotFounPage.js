import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
            <h1 className="text-4xl text-red-500 animate-blink">404</h1>
            <p className="text-center text-gray-700">Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="no-underline mt-5 px-5 py-2 bg-blue-500 text-white rounded-md">Go Back Home</Link>
        </div>
    );

    // Add this to your CSS file
    /*
    @keyframes blink {
      0% {opacity: 1;}
      50% {opacity: 0;}
      100% {opacity: 1;}
    }
    */
};

export default NotFoundPage;

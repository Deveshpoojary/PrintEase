import React from "react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-gradient-to-r from-purple-700 via-purple-800 to-pink-700 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Print<span className="text-pink-200">Ease</span>
            </h2>
            <p className="text-purple-200 mt-2 max-w-md mx-auto">
              Making college printing simple, fast, and affordable for students everywhere.
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center space-x-6 mb-8">
            <a
              href="#"
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.160 1.219-5.160s-.312-.219-.312-.219c0-1.518.887-2.653 1.992-2.653.938 0 1.391.703 1.391 1.547 0 .94-.6 2.353-.908 3.658-.258 1.077.54 1.955 1.602 1.955 1.922 0 3.213-2.028 3.213-4.955 0-2.588-1.86-4.398-4.52-4.398-3.08 0-4.889 2.309-4.889 4.696 0 .93.357 1.928.803 2.472a.33.33 0 01.076.323c-.084.352-.273 1.11-.31 1.267-.048.201-.159.244-.366.147-1.36-.634-2.212-2.623-2.212-4.22 0-3.41 2.476-6.54 7.138-6.54 3.747 0 6.661 2.669 6.661 6.232 0 3.719-2.344 6.714-5.596 6.714-1.093 0-2.123-.568-2.474-1.317l-.673 2.568c-.243.939-.902 2.11-1.343 2.827C9.537 23.673 10.753 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
              </svg>
            </a>
            
            <a
              href="#"
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="border-t border-purple-600 pt-8">
            <p className="text-purple-200">
              © 2024 PrintEase. All rights reserved. Made with ❤️ for students.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
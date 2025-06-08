import { useState } from "react";
import { SignedIn, UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <nav className="fixed w-full top-0 z-50 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">
              Print<span className="text-pink-200">Ease</span>
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#"
                className="text-white hover:text-pink-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-white hover:text-pink-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Features
              </a>
              <a
                href="#"
                className="text-white hover:text-pink-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Upload
              </a>
              <a
                href="#contact"
                className="text-white hover:text-pink-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Contact
              </a>
              <div className="absolute right-4 top-4">
              <SignedIn>
                <div className="flex items-center gap-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-pink-200 focus:outline-none focus:text-pink-200 transition-colors duration-300"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-purple-800 bg-opacity-95 rounded-lg mt-2">
              <a
                href="#"
                className="text-white hover:text-pink-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-white hover:text-pink-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
              >
                Features
              </a>
              <a
                href="#"
                className="text-white hover:text-pink-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
              >
                Upload
              </a>
              <a
                href="#"
                className="text-white hover:text-pink-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

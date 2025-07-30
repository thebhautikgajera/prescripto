import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useState, useContext, useEffect, useRef } from "react";
import AppContext from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMenu]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    return () => {
      setShowMenu(false);
    };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "DOCTORS", path: "/doctors" },
    { name: "SYMPTOM CHECKER", path: "/symptom-checker" },
    { name: "ABOUT", path: "/about" },
    { name: "CONTACT", path: "/contact" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg py-3"
          : "bg-white/90 backdrop-blur-sm py-3"
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        <div className="flex items-center">
          <img
            onClick={() => navigate("/")}
            className="w-36 md:w-40 cursor-pointer transition-transform hover:scale-105"
            src={assets.logo}
            alt="Prescripto"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <ul className="flex items-center space-x-8 font-medium">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-1 py-2 block transition-colors duration-300 ${
                      isActive
                        ? "text-primary font-semibold"
                        : "text-gray-700 hover:text-primary"
                    }`
                  }
                >
                  {item.name}
                  <span
                    className={({ isActive }) =>
                      `absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-bottom scale-x-0 transition-transform duration-300 ${
                        isActive ? "scale-x-100" : ""
                      }`
                    }
                  ></span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <img
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  src={user && user.image ? user.image : assets.profile_pic}
                  alt="Profile"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = assets.profile_pic;
                  }}
                />
                <span className="hidden md:inline-block font-medium text-gray-700 truncate max-w-[100px]">
                  {user.name}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {/* User Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 animate-fadeIn z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <NavLink
                      to="/my-profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/my-appointments"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      My Appointments
                    </NavLink>
                    <NavLink
                      to="/payment-history"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                      </svg>
                      Payment History
                    </NavLink>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="text-primary border border-primary px-5 py-2 rounded-full font-medium hover:bg-primary/5 transition-all duration-300"
              >
                LOGIN
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-300"
              >
                REGISTER
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-expanded={showMenu}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      {showMenu && (
        <div 
          className="fixed top-0 left-0 w-screen h-screen bg-white z-[100] md:hidden overflow-hidden"
        >
          <div className="h-full w-full flex flex-col overflow-y-auto">
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <img src={assets.logo} alt="Prescripto" className="w-36" />
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {/* Mobile Navigation Content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="px-4 py-6">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.path}
                        onClick={() => setShowMenu(false)}
                        className={({ isActive }) =>
                          `block px-4 py-3 rounded-lg font-medium ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`
                        }
                      >
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>

                {/* Mobile Auth Buttons */}
                {!isAuthenticated && (
                  <div className="mt-8 space-y-3 px-4">
                    <button
                      onClick={() => {
                        navigate("/login");
                        setShowMenu(false);
                      }}
                      className="w-full py-3 text-center border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-all"
                    >
                      LOGIN
                    </button>
                    <button
                      onClick={() => {
                        navigate("/register");
                        setShowMenu(false);
                      }}
                      className="w-full py-3 text-center bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
                    >
                      REGISTER
                    </button>
                  </div>
                )}

                {/* Mobile User Menu */}
                {isAuthenticated && (
                  <div className="mt-5 border-t border-gray-100 px-4">
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="flex items-center justify-center w-full py-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      LOGOUT
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;

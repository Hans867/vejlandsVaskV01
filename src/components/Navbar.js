import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Fejl ved log ud:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-100">
      <div className="container mx-auto px-4 max-w-md md:max-w-4xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-800 transition-colors">
            VejlandVask
          </Link>

          {currentUser && (
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/book" className="text-gray-700 hover:text-blue-600 transition-colors">
                Book Vask
              </Link>
              <Link to="/schedule" className="text-gray-700 hover:text-blue-600 transition-colors">
                Program
              </Link>
              <Link to="/my-bookings" className="text-gray-700 hover:text-blue-600 transition-colors">
                Mine Bookinger
              </Link>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ 
                    backgroundColor: userProfile?.farve || '#3B82F6',
                    color: userProfile?.farve === '#EAB308' || userProfile?.farve === '#84CC16' ? 'black' : 'white'
                  }}
                >
                  {userProfile?.brugernavn?.[0]?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors text-sm"
                >
                  Log ud
                </button>
              </div>
            </div>
          )}

          {currentUser && (
            <button
              onClick={toggleMenu}
              className="md:hidden flex items-center px-3 py-2 border rounded text-gray-500 border-gray-600 hover:text-gray-900 hover:border-gray-900"
            >
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
              </svg>
            </button>
          )}

          {!currentUser && (
            <div className="flex space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                Log ind
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Opret bruger
              </Link>
            </div>
          )}
        </div>

        {currentUser && isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <div className="flex items-center space-x-2 px-3 py-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ 
                    backgroundColor: userProfile?.farve || '#3B82F6',
                    color: userProfile?.farve === '#EAB308' || userProfile?.farve === '#84CC16' ? 'black' : 'white'
                  }}
                >
                  {userProfile?.brugernavn?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-gray-700 font-medium">{userProfile?.brugernavn}</span>
              </div>
              
              <Link 
                to="/dashboard" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/book" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Book Vask
              </Link>
              <Link 
                to="/schedule" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Program
              </Link>
              <Link 
                to="/my-bookings" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Mine Bookinger
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Log ud
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 
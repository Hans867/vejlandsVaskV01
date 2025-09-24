import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const Register = () => {
  const { signup, getAvailableColors } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brugernavn: '',
    email: '',
    password: '',
    confirmPassword: '',
    farve: ''
  });
  const [availableColors, setAvailableColors] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingColors, setLoadingColors] = useState(true);

  // memoize the functions that are used inside useEffect so they can be safely
  // referenced in the dependency array without triggering eslint warnings
  const checkUserCount = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef));
      setUserCount(snapshot.size);
    } catch (error) {
      console.error('Fejl ved optælling af brugere:', error);
    }
  }, []);

  const loadAvailableColors = useCallback(async () => {
    try {
      setLoadingColors(true);
      const colors = await getAvailableColors();
      setAvailableColors(colors || []);
    } catch (error) {
      console.error('Fejl ved indlæsning af farver:', error);
      setError('Fejl ved indlæsning af tilgængelige farver');
    } finally {
      setLoadingColors(false);
    }
  }, [getAvailableColors]);

  // include memoized functions in the dependency array
  useEffect(() => {
    checkUserCount();
    loadAvailableColors();
  }, [checkUserCount, loadAvailableColors]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleColorSelect = (colorValue) => {
    setFormData({
      ...formData,
      farve: colorValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userCount >= 4) {
      setError('Maks 4 brugere kan oprettes. Alle pladser er optaget.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Kodeordene matcher ikke');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kodeord skal være mindst 6 karakterer');
      return;
    }

    if (!formData.farve) {
      setError('Vælg venligst en farve for din husstand');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await signup(formData.email, formData.password, formData.brugernavn, formData.farve);
      
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Fejl ved oprettelse af bruger';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Denne email er allerede i brug';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig email adresse';
          break;
        case 'auth/weak-password':
          errorMessage = 'Kodeord skal være mindst 6 karakterer';
          break;
        default:
          errorMessage = 'Der opstod en fejl ved oprettelse af bruger';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (userCount >= 4) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-6 shadow rounded-lg border border-gray-100 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Alle pladser optaget
            </h2>
            <p className="text-gray-600 mb-6">
              Der kan maks være 4 brugere registreret. Kontakt dine naboer hvis du mener der er en fejl.
            </p>
            <Link 
              to="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tilbage til forsiden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Opret bruger
          </h2>
          <p className="text-gray-600">
            Plads {userCount + 1} af 4 husstande
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="brugernavn" className="block text-sm font-medium text-gray-700 mb-2">
                Brugernavn
              </label>
              <input
                id="brugernavn"
                name="brugernavn"
                type="text"
                required
                value={formData.brugernavn}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vælg et brugernavn"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Din email adresse"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kodeord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mindst 6 karakterer"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Bekræft kodeord
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gentag dit kodeord"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vælg husstandsfarve
              </label>
              {loadingColors ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : availableColors.length === 0 ? (
                <p className="text-red-600 text-sm">Alle farver er optaget</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorSelect(color.value)}
                      className={`w-full h-16 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                        formData.farve === color.value
                          ? 'border-gray-800 scale-105 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400 hover:scale-102'
                      }`}
                      style={{ 
                        backgroundColor: color.value,
                        color: color.textColor
                      }}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{color.name}</div>
                        {formData.farve === color.value && (
                          <div className="text-xs mt-1">✓ Valgt</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || availableColors.length === 0}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || availableColors.length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Opretter bruger...
                </div>
              ) : (
                'Opret bruger'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Har du allerede en konto?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Log ind her
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

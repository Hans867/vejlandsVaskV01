import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'Fejl ved log ind';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Ingen bruger fundet med denne email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Forkert kodeord';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig email adresse';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'For mange fejlslagne forsøg. Prøv igen senere';
          break;
        default:
          errorMessage = 'Der opstod en fejl ved log ind';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Log ind
          </h2>
          <p className="text-gray-600">
            Log ind for at booke vasketider
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
                placeholder="Dit kodeord"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Logger ind...
                </div>
              ) : (
                'Log ind'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Har du ikke en konto?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Opret bruger her
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

export default Login; 
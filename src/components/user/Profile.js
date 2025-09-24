import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { updatePassword } from 'firebase/auth';

const Profile = () => {
  const { currentUser, userProfile, logout, availableColors } = useAuth();
  const [formData, setFormData] = useState({
    brugernavn: userProfile?.brugernavn || '',
    farve: userProfile?.farve || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [availColors, setAvailColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        brugernavn: userProfile.brugernavn || '',
        farve: userProfile.farve || ''
      }));
    }
    loadAvailableColors();
  }, [userProfile]);

  const loadAvailableColors = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef));
      const usedColors = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.farve && doc.id !== currentUser.uid) {
          usedColors.push(userData.farve);
        }
      });
      
      const colors = availableColors.filter(color => 
        !usedColors.includes(color.value) || color.value === userProfile?.farve
      );
      
      setAvailColors(colors);
    } catch (error) {
      console.error('Fejl ved indlæsning af farver:', error);
    }
  };

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.brugernavn.trim()) {
      setError('Brugernavn kan ikke være tomt');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        brugernavn: formData.brugernavn.trim(),
        farve: formData.farve,
        updatedAt: new Date()
      });
      
      setSuccess('Profil opdateret succesfuldt!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Fejl ved opdatering af profil:', error);
      setError('Der opstod en fejl ved opdatering af profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Udfyld alle kodeord felter');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('De nye kodeord matcher ikke');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Nyt kodeord skal være mindst 6 karakterer');
      return;
    }

    try {
      setPasswordLoading(true);
      setError('');
      
      await updatePassword(currentUser, formData.newPassword);
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSuccess('Kodeord ændret succesfuldt!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Fejl ved ændring af kodeord:', error);
      
      let errorMessage = 'Der opstod en fejl ved ændring af kodeord';
      
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Du skal logge ind igen for at ændre dit kodeord';
          break;
        case 'auth/weak-password':
          errorMessage = 'Det nye kodeord er for svagt';
          break;
        default:
          errorMessage = 'Fejl ved ændring af kodeord. Prøv at logge ud og ind igen.';
      }
      
      setError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Er du sikker på at du vil logge ud?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Fejl ved log ud:', error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold mr-4"
            style={{ 
              backgroundColor: userProfile?.farve || '#3B82F6',
              color: userProfile?.farve === '#EAB308' || userProfile?.farve === '#84CC16' ? 'black' : 'white'
            }}
          >
            {userProfile?.brugernavn?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Min Profil</h1>
            <p className="text-gray-600">Administrer dine kontoindstillinger</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Profil Information
        </h2>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (kan ikke ændres)
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="brugernavn" className="block text-sm font-medium text-gray-700 mb-2">
              Brugernavn
            </label>
            <input
              id="brugernavn"
              name="brugernavn"
              type="text"
              value={formData.brugernavn}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dit brugernavn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Husstandsfarve
            </label>
            {availColors.length === 0 ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availColors.map((color) => (
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
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Opdaterer...' : 'Opdater Profil'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Skift Kodeord
        </h2>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nyt kodeord
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Indtast nyt kodeord"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Bekræft nyt kodeord
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Gentag nyt kodeord"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              passwordLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {passwordLoading ? 'Ændrer kodeord...' : 'Skift Kodeord'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Konto Handlinger
        </h2>
        
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            Log ud
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Information:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Din farve identificerer dig i programmerne</li>
            <li>• Du kan kun ændre til en farve der ikke er i brug</li>
            <li>• Ved problemer, kontakt dine naboer</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
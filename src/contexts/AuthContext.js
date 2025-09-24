import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const availableColors = [
    { name: 'Rød', value: '#EF4444', textColor: 'white' },
    { name: 'Blå', value: '#3B82F6', textColor: 'white' },
    { name: 'Grøn', value: '#10B981', textColor: 'white' },
    { name: 'Lilla', value: '#8B5CF6', textColor: 'white' },
    { name: 'Orange', value: '#F97316', textColor: 'white' },
    { name: 'Pink', value: '#EC4899', textColor: 'white' },
    { name: 'Gul', value: '#EAB308', textColor: 'black' },
    { name: 'Cyan', value: '#06B6D4', textColor: 'white' },
    { name: 'Lime', value: '#84CC16', textColor: 'black' }
  ];

  const signup = async (email, password, brugernavn, farve) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      brugernavn: brugernavn,
      farve: farve,
      email: email,
      createdAt: new Date()
    });
    
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const getUsersColors = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef));
    const usedColors = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.farve) {
        usedColors.push(userData.farve);
      }
    });
    
    return usedColors;
  };

  const getAvailableColors = async () => {
    const usedColors = await getUsersColors();
    return availableColors.filter(color => !usedColors.includes(color.value));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    getUsersColors,
    getAvailableColors,
    availableColors
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
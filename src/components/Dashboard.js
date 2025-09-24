import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [currentBooking, setCurrentBooking] = useState(null);
  const [nextBooking, setNextBooking] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBookingUser, setCurrentBookingUser] = useState(null);
  const [nextBookingUser, setNextBookingUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      const currentBookingsQuery = query(
        collection(db, 'bookings'),
        where('status', '==', 'running'),
        limit(1)
      );
      const currentSnapshot = await getDocs(currentBookingsQuery);
      
      if (!currentSnapshot.empty) {
        const booking = { id: currentSnapshot.docs[0].id, ...currentSnapshot.docs[0].data() };
        setCurrentBooking(booking);
        
        const userDoc = await getDoc(doc(db, 'users', booking.userId));
        if (userDoc.exists()) {
          setCurrentBookingUser(userDoc.data());
        }
      }

      const upcomingQuery = query(
        collection(db, 'bookings'),
        where('status', '==', 'booked'),
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        limit(1)
      );
      const upcomingSnapshot = await getDocs(upcomingQuery);
      
      if (!upcomingSnapshot.empty) {
        const booking = { id: upcomingSnapshot.docs[0].id, ...upcomingSnapshot.docs[0].data() };
        setNextBooking(booking);
        
        const userDoc = await getDoc(doc(db, 'users', booking.userId));
        if (userDoc.exists()) {
          setNextBookingUser(userDoc.data());
        }
      }

      if (userProfile) {
        const userBookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', userProfile.uid || 'current-user-id'),
          where('status', '==', 'booked'),
          where('startTime', '>', now),
          orderBy('startTime', 'asc'),
          limit(3)
        );
        const userBookingsSnapshot = await getDocs(userBookingsQuery);
        const bookings = userBookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserBookings(bookings);
      }

    } catch (error) {
      console.error('Fejl ved indlæsning af dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('da-DK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatTime(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ 
              backgroundColor: userProfile?.farve || '#3B82F6',
              color: userProfile?.farve === '#EAB308' || userProfile?.farve === '#84CC16' ? 'black' : 'white'
            }}
          >
            {userProfile?.brugernavn?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hej, {userProfile?.brugernavn}!
            </h1>
            <p className="text-gray-600">
              Velkommen til dit vask dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🔄</span>
          Vaskemaskine Status
        </h2>
        
        {currentBooking && currentBookingUser ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ 
                      backgroundColor: currentBookingUser.farve,
                      color: currentBookingUser.farve === '#EAB308' || currentBookingUser.farve === '#84CC16' ? 'black' : 'white'
                    }}
                  >
                    {currentBookingUser.brugernavn?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentBookingUser.brugernavn} vasker nu
                    </p>
                    <p className="text-sm text-gray-600">
                      Startede: {formatDate(currentBooking.startTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">I BRUG</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">LEDIG</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Vaskemaskinen er klar til brug
            </p>
          </div>
        )}
      </div>

      {nextBooking && nextBookingUser && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Næste Booking
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ 
                  backgroundColor: nextBookingUser.farve,
                  color: nextBookingUser.farve === '#EAB308' || nextBookingUser.farve === '#84CC16' ? 'black' : 'white'
                }}
              >
                {nextBookingUser.brugernavn?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {nextBookingUser.brugernavn}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(nextBooking.startTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Hurtige handlinger
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/book"
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">Book Vask</div>
            <div className="text-sm opacity-90">Book en vasketid</div>
          </Link>
          
          <Link
            to="/schedule"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Se Program</div>
            <div className="text-sm opacity-90">Se alle bookinger</div>
          </Link>
        </div>
      </div>

      {userBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Dine kommende bookinger
            </h2>
            <Link 
              to="/my-bookings" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Se alle →
            </Link>
          </div>
          <div className="space-y-3">
            {userBookings.map((booking) => (
              <div 
                key={booking.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: userProfile?.farve || '#3B82F6' }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(booking.startTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Varighed: {booking.duration} minutter
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Booket
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
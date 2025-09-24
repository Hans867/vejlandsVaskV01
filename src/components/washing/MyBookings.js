import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

const MyBookings = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUserBookings = useCallback(async () => {
    try {
      setLoading(true);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', currentUser.uid),
        orderBy('startTime', 'desc')
      );

      const snapshot = await getDocs(bookingsQuery);
      const userBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      }));

      setBookings(userBookings);
    } catch (error) {
      console.error('Fejl ved hentning af bookinger:', error);
      setError('Fejl ved indlæsning af bookinger');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  const formatDateTime = (date) => {
    return date.toLocaleString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBookingStatus = (booking) => {
    const now = new Date();
    
    if (booking.status === 'cancelled') {
      return { text: 'Aflyst', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    
    if (booking.status === 'completed') {
      return { text: 'Afsluttet', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    
    if (booking.status === 'running') {
      return { text: 'Kører nu', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    }
    
    if (booking.endTime < now) {
      return { text: 'Forpasset', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    }
    
    if (booking.startTime <= now && booking.endTime > now) {
      return { text: 'Aktiv', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    
    return { text: 'Planlagt', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  };

  const canCancelBooking = (booking) => {
    const now = new Date();
    const timeDiff = booking.startTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDiff / (1000 * 60 * 60);
    
    return booking.status === 'booked' && hoursUntilBooking > 1;
  };

  const canStartWashing = (booking) => {
    const now = new Date();
    const timeDiff = booking.startTime.getTime() - now.getTime();
    const minutesUntilBooking = timeDiff / (1000 * 60);
    
    return booking.status === 'booked' && 
           minutesUntilBooking <= 15 && 
           minutesUntilBooking >= -5;
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Er du sikker på at du vil aflyse denne booking?')) {
      return;
    }

    try {
      setActionLoading(bookingId);
      await deleteDoc(doc(db, 'bookings', bookingId));
      
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      setSuccess('Booking aflyst succesfuldt');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Fejl ved aflysning:', error);
      setError('Fejl ved aflysning af booking');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartWashing = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'running',
        actualStartTime: new Date()
      });
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'running', actualStartTime: new Date() }
          : booking
      ));
      
      setSuccess('Vask startet! Husk at markere som afsluttet når du er færdig');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('Fejl ved start af vask:', error);
      setError('Fejl ved start af vask');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteWashing = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        completedAt: new Date()
      });
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'completed', completedAt: new Date() }
          : booking
      ));
      
      setSuccess('Vask markeret som afsluttet. Tak for at være hensynsfuld!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Fejl ved afslutning af vask:', error);
      setError('Fejl ved afslutning af vask');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold mr-3"
            style={{ 
              backgroundColor: userProfile?.farve || '#3B82F6',
              color: userProfile?.farve === '#EAB308' || userProfile?.farve === '#84CC16' ? 'black' : 'white'
            }}
          >
            {userProfile?.brugernavn?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mine Bookinger</h1>
            <p className="text-gray-600">Administrer dine vasketider</p>
          </div>
        </div>
        
        <Link 
          to="/book"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Ny Booking
        </Link>
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

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ingen bookinger endnu
          </h2>
          <p className="text-gray-600 mb-6">
            Du har ikke booket nogen vasketider endnu. Book din første vasketid nu!
          </p>
          <Link 
            to="/book"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Vasketid
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = getBookingStatus(booking);
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: userProfile?.farve || '#3B82F6' }}
                    ></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatDateTime(booking.startTime)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)} 
                        ({booking.duration} min)
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canStartWashing(booking) && (
                    <button
                      onClick={() => handleStartWashing(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? 'Starter...' : 'Start Vask'}
                    </button>
                  )}

                  {booking.status === 'running' && (
                    <button
                      onClick={() => handleCompleteWashing(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? 'Afslutter...' : 'Afslut Vask'}
                    </button>
                  )}

                  {canCancelBooking(booking) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? 'Aflyser...' : 'Aflys'}
                    </button>
                  )}
                </div>

                {!canCancelBooking(booking) && booking.status === 'booked' && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Du kan kun aflyse bookinger mere end 1 time i forvejen
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

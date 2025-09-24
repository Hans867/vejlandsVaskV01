import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingsForDate(selectedDate);
  }, [selectedDate]);

  const fetchBookingsForDate = async (date) => {
    try {
      setLoading(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay),
        where('status', 'in', ['booked', 'running', 'completed']),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(bookingsQuery);
      const dayBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      }));

      setBookings(dayBookings);

      const userMap = {};
      for (const booking of dayBookings) {
        if (!userMap[booking.userId]) {
          const userDoc = await getDoc(doc(db, 'users', booking.userId));
          if (userDoc.exists()) {
            userMap[booking.userId] = userDoc.data();
          }
        }
      }
      setUsers(userMap);

    } catch (error) {
      console.error('Fejl ved hentning af program:', error);
      setError('Fejl ved indlæsning af program');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBookingStatus = (booking) => {
    const now = new Date();
    
    if (booking.status === 'cancelled') {
      return { text: 'Aflyst', color: 'text-red-600', bgColor: 'bg-red-100', icon: '❌' };
    }
    
    if (booking.status === 'completed') {
      return { text: 'Afsluttet', color: 'text-green-600', bgColor: 'bg-green-100', icon: '✅' };
    }
    
    if (booking.status === 'running') {
      return { text: 'Kører nu', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '🔄' };
    }
    
    if (booking.endTime < now) {
      return { text: 'Forpasset', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '⏰' };
    }
    
    if (booking.startTime <= now && booking.endTime > now) {
      return { text: 'Aktiv', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🟢' };
    }
    
    return { text: 'Planlagt', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '📅' };
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split('T')[0];
  };

  const isTimeSlotOccupied = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);
    
    return bookings.find(booking => {
      return slotTime >= booking.startTime && slotTime < booking.endTime;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vaskeprogram</h1>
        <p className="text-gray-600">Se alle bookede vasketider for alle husstande</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Vælg dato:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-sm text-gray-600">
            {formatDate(selectedDate)}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setSelectedDate(yesterday.toISOString().split('T')[0]);
          }}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          I går
        </button>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
        >
          I dag
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow.toISOString().split('T')[0]);
          }}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          I morgen
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Timeline Oversigt
        </h2>
        <div className="grid grid-cols-12 gap-1 text-xs">
          {generateTimeSlots().map((timeSlot) => {
            const occupiedBooking = isTimeSlotOccupied(timeSlot);
            const user = occupiedBooking ? users[occupiedBooking.userId] : null;
            
            return (
              <div
                key={timeSlot}
                className={`h-12 border rounded flex items-center justify-center text-center ${
                  occupiedBooking
                    ? 'border-gray-400'
                    : 'border-gray-200 bg-gray-50'
                }`}
                style={{
                  backgroundColor: occupiedBooking && user ? user.farve : undefined,
                  color: occupiedBooking && user 
                    ? (user.farve === '#EAB308' || user.farve === '#84CC16' ? 'black' : 'white')
                    : undefined
                }}
                title={occupiedBooking 
                  ? `${user?.brugernavn || 'Ukendt'} (${formatTime(occupiedBooking.startTime)} - ${formatTime(occupiedBooking.endTime)})`
                  : `Ledig: ${timeSlot}`
                }
              >
                {occupiedBooking ? (
                  <div className="text-center">
                    <div className="font-semibold text-xs">
                      {user?.brugernavn?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">{timeSlot}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            📋 Bookinger for {formatDate(selectedDate)}
          </h2>
          <span className="text-sm text-gray-500">
            {bookings.length} booking{bookings.length !== 1 ? 'er' : ''}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🧺</div>
            <p className="text-gray-600">Ingen bookinger for denne dag</p>
            <p className="text-sm text-gray-500">Vaskemaskinen er ledig hele dagen!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const user = users[booking.userId];
              const status = getBookingStatus(booking);
              
              return (
                <div 
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ 
                          backgroundColor: user?.farve || '#3B82F6',
                          color: user?.farve === '#EAB308' || user?.farve === '#84CC16' ? 'black' : 'white'
                        }}
                      >
                        {user?.brugernavn?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {user?.brugernavn || 'Ukendt bruger'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)} ({booking.duration} min)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{status.icon}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Forklaring:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>🟢</span>
            <span>Aktiv (kører nu)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔄</span>
            <span>Startet af bruger</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span>Planlagt</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span>Afsluttet</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⏰</span>
            <span>Forpasset</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>Aflyst</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
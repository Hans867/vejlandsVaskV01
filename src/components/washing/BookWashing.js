import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

const BookWashing = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchBookingsForDate = async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay),
        where('status', 'in', ['booked', 'running']),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(bookingsQuery);
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate()
      }));

      setExistingBookings(bookings);
    } catch (error) {
      console.error('Fejl ved hentning af bookinger:', error);
    }
  };

  const isTimeSlotAvailable = (timeSlot, selectedDuration) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + selectedDuration);

    return !existingBookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      return (slotStart < bookingEnd && slotEnd > bookingStart);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError('Vælg venligst både dato og tid');
      return;
    }

    const now = new Date();
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const bookingStart = new Date(selectedDate);
    bookingStart.setHours(hours, minutes, 0, 0);

    if (bookingStart <= now) {
      setError('Du kan ikke booke i fortiden');
      return;
    }

    if (!isTimeSlotAvailable(selectedTime, duration)) {
      setError('Dette tidsrum er ikke tilgængeligt');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const bookingEnd = new Date(bookingStart);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + duration);

      await addDoc(collection(db, 'bookings'), {
        userId: currentUser.uid,
        startTime: bookingStart,
        endTime: bookingEnd,
        duration: duration,
        status: 'booked',
        createdAt: new Date()
      });

      setSuccess('Booking oprettet succesfuldt!');
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);

    } catch (error) {
      console.error('Fejl ved oprettelse af booking:', error);
      setError('Der opstod en fejl ved booking. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Book Vasketid</h1>
            <p className="text-gray-600">Vælg dato og tidspunkt for din vask</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vælg dato
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Varighed
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutter</option>
              <option value={60}>1 time</option>
              <option value={90}>1.5 timer</option>
              <option value={120}>2 timer</option>
            </select>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vælg tidspunkt
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                {timeSlots.map((time) => {
                  const available = isTimeSlotAvailable(time, duration);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      disabled={!available}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : available
                          ? 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && existingBookings.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                Eksisterende bookinger for {new Date(selectedDate).toLocaleDateString('da-DK')}:
              </h3>
              <div className="space-y-2">
                {existingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm">
                    <span>
                      {booking.startTime.toLocaleTimeString('da-DK', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {booking.endTime.toLocaleTimeString('da-DK', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="text-gray-500">Optaget</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedDate || !selectedTime}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              loading || !selectedDate || !selectedTime
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Booker...
              </div>
            ) : (
              'Book Vasketid'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📝 Husk:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Du kan booke op til 2 uger i forvejen</li>
            <li>• Husk at fjerne dit tøj når vasken er færdig</li>
            <li>• Du kan se og administrere dine bookinger under "Mine Bookinger"</li>
            <li>• Vær hensynsfuld overfor dine naboer</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookWashing; 
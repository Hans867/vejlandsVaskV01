import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="text-center py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            Velkommen til <br />
            <span className="text-blue-600">VejlandVask</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Den smarte løsning til at koordinere vaskemaskinen mellem husstande. 
            Ingen flere konflikter - kun ren tøj og glade naboer! 🧺
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Book Nemt</h3>
            <p className="text-gray-600 text-sm">
              Book din vasketid på sekunder og se hvornår maskinen er ledig
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Farve System</h3>
            <p className="text-gray-600 text-sm">
              Hver husstand har sin egen farve - nemt at se hvem der vasker hvornår
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Mobil Første</h3>
            <p className="text-gray-600 text-sm">
              Optimeret til din telefon, men fungerer perfekt på alle enheder
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
          {currentUser ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Du er logget ind!</h2>
              <p className="mb-6">Gå til dit dashboard og begynd at booke vasketider</p>
              <Link 
                to="/dashboard" 
                className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Gå til Dashboard →
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">Klar til at komme i gang?</h2>
              <p className="mb-6">Opret din bruger og vælg din husstandsfarve</p>
              <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
                <Link 
                  to="/register" 
                  className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Opret Bruger
                </Link>
                <Link 
                  to="/login" 
                  className="inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Log Ind
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>
            Maks 4 husstande kan oprette brugere. 
            Kontakt din nabo hvis alle pladser er optaget.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Définition des icônes personnalisées
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36">
      <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 1-.064-2.134A1.866 1.866 0 0 1 5.25 5.25h2.115a1.5 1.5 0 0 1 1.389.933c.11.255.184.521.223.797a.75.75 0 0 0 1.404.055 32.517 32.517 0 0 1 2.855-5.347 1.5 1.5 0 0 1 1.271-.665h.922c.846 0 1.571.607 1.719 1.441a17.897 17.897 0 0 1-3.114 14.085 1.125 1.125 0 0 1-.875.422H8.25Z" />
    </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Icône pour la position de l'utilisateur
const userIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const vehicleIcons = {
  'en route': createCustomIcon('#16a34a'),
  'en pause': createCustomIcon('#ca8a04'),
  'terminé': createCustomIcon('#dc2626'),
  'default': createCustomIcon('#6b7280')
};

const defaultCenter = [46.603354, 1.888334];
const defaultZoom = 6;

// Composant pour la géolocalisation
function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position ? (
    <Marker position={position} icon={userIcon}>
      <Popup>Vous êtes ici</Popup>
    </Marker>
  ) : null;
}

function LiveTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const mapRef = useRef(null);
  
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('initialPositions', (positions) => {
      setVehicles(positions);
      setFilteredVehicles(positions);
    });

    socket.on('locationUpdated', (data) => {
      setVehicles(prev => {
        const newVehicles = prev.map(v => 
          v.id === data.vehicleId 
            ? { ...v, latitude: data.latitude, longitude: data.longitude, statut: data.statut }
            : v
        );
        applyFilters(newVehicles, searchTerm, statusFilter);
        return newVehicles;
      });
    });

    socket.emit('requestPositions');

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    applyFilters(vehicles, searchTerm, statusFilter);
  }, [searchTerm, statusFilter, vehicles]);

  const applyFilters = (vehiclesList, search, status) => {
    let filtered = vehiclesList;
    
    if (search) {
      filtered = filtered.filter(v => 
        v.nom.toLowerCase().includes(search.toLowerCase()) ||
        v.conducteur.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(v => v.statut === status);
    }
    
    setFilteredVehicles(filtered);
  };

  const fetchVehicleHistory = async (vehicleId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/historique/${vehicleId}`);
      setVehicleHistory(response.data);
      setShowHistory(true);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const getMarkerColor = (statut) => {
    switch (statut) {
      case 'en route': return 'text-green-600';
      case 'en pause': return 'text-yellow-600';
      case 'terminé': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatETA = (eta) => {
    if (!eta) return 'Non disponible';
    return new Date(eta).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un véhicule ou conducteur..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="en route">En route</option>
            <option value="en pause">En pause</option>
            <option value="terminé">Terminé</option>
          </select>
        </div>

        <div className="h-[600px] rounded-lg overflow-hidden relative">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            
            {showHistory && vehicleHistory.length > 0 && (
              <Polyline
                positions={vehicleHistory.map(pos => [pos.latitude, pos.longitude])}
                color="#3b82f6"
                weight={3}
                opacity={0.7}
              />
            )}

            {filteredVehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[vehicle.latitude, vehicle.longitude]}
                icon={vehicleIcons[vehicle.statut] || vehicleIcons.default}
              >
                <Popup className="vehicle-popup">
                  <div className="p-3 min-w-[200px]">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-2">{vehicle.nom}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm">
                          <span className="font-medium">Conducteur:</span> {vehicle.conducteur}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm">
                          <span className="font-medium">Destination:</span> {vehicle.destination || 'Non spécifiée'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">
                          <span className="font-medium">ETA:</span> {formatETA(vehicle.eta)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill={vehicle.statut === 'en route' ? '#16a34a' : vehicle.statut === 'en pause' ? '#ca8a04' : '#dc2626'} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                        <p className={`text-sm ${getMarkerColor(vehicle.statut)}`}>
                          {vehicle.statut}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle.id);
                          fetchVehicleHistory(vehicle.id);
                        }}
                        className="mt-2 w-full px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Voir l'historique
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Liste des Véhicules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold">{vehicle.nom}</h4>
              <p className={`${getMarkerColor(vehicle.statut)} text-sm`}>
                {vehicle.statut}
              </p>
              <p className="text-sm text-gray-600">
                Conducteur: {vehicle.conducteur}
              </p>
              <p className="text-sm text-gray-600">
                Destination: {vehicle.destination || 'Non spécifiée'}
              </p>
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle.id);
                  fetchVehicleHistory(vehicle.id);
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Voir l'historique
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveTracking;
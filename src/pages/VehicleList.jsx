import { useState, useEffect } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/vehicles');
        setVehicles(response.data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des véhicules');
        setVehicles([]);
      }
    };

    fetchVehicles();
  }, []);

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-xl font-semibold">Liste des Véhicules</h2>
      </div>
      <div className="border-t border-gray-200">
        {vehicles.length === 0 ? (
          <p className="px-4 py-4 text-gray-500">Aucun véhicule disponible</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                    <p className="text-sm text-gray-500">{vehicle.status}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Dernière mise à jour: {new Date(vehicle.last_update).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VehicleList;
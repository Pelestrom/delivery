import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Fonction pour récupérer les positions des véhicules
async function getVehiclesPositions() {
  try {
    const [rows] = await pool.query('SELECT id, nom, latitude, longitude, statut FROM vehicules');
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des positions:', error);
    return [];
  }
}

// Liste des véhicules
app.get('/api/vehicules', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicules');
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un véhicule par ID
app.get('/api/vehicules/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicules WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Véhicule non trouvé' });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du véhicule:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un véhicule
app.post('/api/vehicules', async (req, res) => {
  const { nom, statut, latitude, longitude, conducteur } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO vehicules (nom, statut, latitude, longitude, conducteur) VALUES (?, ?, ?, ?, ?)',
      [nom, statut, latitude, longitude, conducteur]
    );
    
    const [newVehicle] = await pool.query('SELECT * FROM vehicules WHERE id = ?', [result.insertId]);
    
    // Émettre la mise à jour aux clients connectés
    io.emit('vehicleAdded', newVehicle[0]);
    
    res.status(201).json(newVehicle[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du véhicule:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un véhicule
app.put('/api/vehicules/:id', async (req, res) => {
  const { nom, statut, latitude, longitude, conducteur } = req.body;
  const vehiculeId = req.params.id;

  try {
    const [existingVehicle] = await pool.query('SELECT * FROM vehicules WHERE id = ?', [vehiculeId]);
    if (existingVehicle.length === 0) {
      res.status(404).json({ error: 'Véhicule non trouvé' });
      return;
    }

    await pool.query(
      'UPDATE vehicules SET nom = ?, statut = ?, latitude = ?, longitude = ?, conducteur = ? WHERE id = ?',
      [nom, statut, latitude, longitude, conducteur, vehiculeId]
    );

    // Si la position a changé, enregistrer dans l'historique
    if (latitude !== existingVehicle[0].latitude || longitude !== existingVehicle[0].longitude) {
      await pool.query(
        'INSERT INTO historique_positions (vehicule_id, latitude, longitude) VALUES (?, ?, ?)',
        [vehiculeId, latitude, longitude]
      );
      
      // Émettre la mise à jour de position aux clients connectés
      io.emit('locationUpdated', {
        vehicleId: vehiculeId,
        nom: nom,
        latitude,
        longitude,
        statut
      });
    }

    const [updatedVehicle] = await pool.query('SELECT * FROM vehicules WHERE id = ?', [vehiculeId]);
    res.json(updatedVehicle[0]);
  } catch (error) {
    console.error('Erreur lors de la modification du véhicule:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un véhicule
app.delete('/api/vehicules/:id', async (req, res) => {
  try {
    const [existingVehicle] = await pool.query('SELECT * FROM vehicules WHERE id = ?', [req.params.id]);
    if (existingVehicle.length === 0) {
      res.status(404).json({ error: 'Véhicule non trouvé' });
      return;
    }

    await pool.query('DELETE FROM vehicules WHERE id = ?', [req.params.id]);
    
    // Émettre l'événement de suppression aux clients connectés
    io.emit('vehicleDeleted', req.params.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer l'historique des positions d'un véhicule
app.get('/api/historique/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM historique_positions WHERE vehicule_id = ? ORDER BY timestamp DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des connexions Socket.IO
io.on('connection', async (socket) => {
  console.log('Client connecté');

  // Envoyer les positions initiales au client qui vient de se connecter
  const positions = await getVehiclesPositions();
  socket.emit('initialPositions', positions);

  // Écouter les demandes de mise à jour de position
  socket.on('requestPositions', async () => {
    const positions = await getVehiclesPositions();
    socket.emit('positionsUpdate', positions);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
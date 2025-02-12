import mysql from 'mysql2/promise';

// Configuration de la connexion à la base de données
const pool = mysql.createPool({
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: '',
  database: 'suivi_vehicules',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('\x1b[32m%s\x1b[0m', '✓ Connexion à la base de données établie avec succès!');
    
    // Vérification de la table utilisateurs
    const [tables] = await connection.query('SHOW TABLES LIKE "utilisateurs"');
    if (tables.length === 0) {
      console.log('\x1b[31m%s\x1b[0m', '✗ La table "utilisateurs" n\'existe pas!');
    } else {
      const [columns] = await connection.query('SHOW COLUMNS FROM utilisateurs');
      console.log('\x1b[36m%s\x1b[0m', '➜ Structure de la table utilisateurs:');
      columns.forEach(column => {
        console.log(`  - ${column.Field} (${column.Type})`);
      });
    }
    
    connection.release();
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '✗ Erreur de connexion à la base de données:');
    console.error(error.message);
    process.exit(1); // Arrête le serveur si la connexion échoue
  }
}

// Exporte la fonction de test pour l'utiliser dans index.js
export { testConnection };
export default pool;
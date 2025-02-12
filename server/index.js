import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());

// ✅ Activation de CORS avec credentials
app.use(cors({
  origin: "http://localhost:5174", // 🔥 Change avec l'URL de ton frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // ✅ Permet l'envoi de cookies et tokens
}));

// ✅ Gérer les requêtes préflight OPTIONS
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5174");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// 💾 Simulons une base de données (remplace par un vrai DB)
const users = {
  utilisateur: { email: "test@example.com", password: "123456" }
};

// 🎯 Route de login
app.post('/login/:type', (req, res) => {
  const { type } = req.params;
  const { email, password } = req.body;

  if (!users[type]) {
    return res.status(400).json({ error: "Type d'utilisateur invalide" });
  }

  if (users[type].email === email && users[type].password === password) {
    return res.status(200).json({ success: true, user: { type, email } });
  } else {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }
});

// ✅ Démarrage du serveur
const PORT = 8081;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur http://localhost:${PORT}`));

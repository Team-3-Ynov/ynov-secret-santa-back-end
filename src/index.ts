import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
});

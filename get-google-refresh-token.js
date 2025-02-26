import { google } from 'googleapis';
import express from 'express';
import open from 'open';

const credentials = {
  "web": {
    "client_id": "82122316308-u1crfqtd2urnra0pbjqlgo8ij2lbdstb.apps.googleusercontent.com",
    "client_secret": "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",
    "redirect_uris": ["http://localhost:3000/oauth2callback"]
  }
};

const oauth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const app = express();

// Genera la URL de autorización
const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Forzar la generación de refresh token
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh Token:', tokens.refresh_token);
    console.log('\nGuarda este refresh_token, lo necesitaremos para configurar el servidor MCP.\n');
    res.send('Token obtenido exitosamente. Puedes cerrar esta ventana.');
    setTimeout(() => process.exit(0), 1000);
  } catch (error) {
    console.error('Error al obtener tokens:', error);
    res.status(500).send('Error al obtener tokens');
  }
});

const server = app.listen(3000, () => {
  console.log('Abriendo el navegador para autorización...');
  open(authUrl);
});

// Cierra el servidor si el proceso es interrumpido
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});

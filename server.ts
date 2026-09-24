import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let resolvedDir = '';
try {
  resolvedDir = __dirname;
} catch (e) {
  resolvedDir = path.dirname(fileURLToPath(import.meta.url));
}

const distPath = path.resolve(resolvedDir, 'dist');

async function start() {
  if (fs.existsSync(distPath)) {
    // Serve production build static files
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Serve development with Vite middlewares
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite failed to load in development mode', e);
    }
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on port ${port} on 0.0.0.0`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
});

/**
 * Occasion Scout — Production & Full-Stack Server
 * Runs Express on port 3000, handles /api endpoints, and serves dist/ static files.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API endpoints
app.use('/api', apiRouter);

// Serve built frontend assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to support client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Occasion Scout] Server listening on http://0.0.0.0:${PORT}`);
});

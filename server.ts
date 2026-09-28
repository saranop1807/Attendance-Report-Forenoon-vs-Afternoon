import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Google Sheets Proxy Route to bypass browser CORS
  app.get('/api/sync-sheet', async (req, res) => {
    try {
      const sheetUrl = req.query.url as string;
      if (!sheetUrl) {
        return res.status(400).json({ error: 'Missing sheet url parameter' });
      }

      const response = await fetch(sheetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/csv,text/plain,*/*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Google Sheets responded with HTTP ${response.status} (${response.statusText})`,
        });
      }

      const csvData = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(csvData);
    } catch (err: any) {
      console.error('Error fetching Google Sheet:', err);
      return res.status(500).json({ error: err.message || 'Internal proxy error' });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import provisionRouter from './routes/provision';
import telemetryRouter from './routes/telemetry';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.options('*', cors({ origin: '*' }));
app.use(express.json());

// Serve install.sh and other scripts from the public directory
app.use('/setup', express.static(path.join(__dirname, '../../public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.sh')) {
      res.setHeader('Content-Type', 'text/x-shellscript');
    }
  }
}));

app.get('/api/packages', (req, res) => {
  try {
    const manifestPath = path.join(__dirname, '../../../packages/manifest.json');
    const data = fs.readFileSync(manifestPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading manifest:', err);
    res.status(500).json({ error: 'Failed to load packages' });
  }
});

app.use('/api', provisionRouter);
app.use('/api', telemetryRouter);

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Provisioner API running on port ${port} (0.0.0.0)`);
});

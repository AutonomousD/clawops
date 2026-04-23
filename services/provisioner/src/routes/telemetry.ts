import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/telemetry', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      ...payload
    };

    // Log to console for active monitoring
    console.log(`[TELEMETRY] ${JSON.stringify(logEntry)}`);

    // Optionally append to a local file for persistent analysis
    const logFile = path.resolve(process.cwd(), 'telemetry.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    res.status(200).json({ success: true, message: 'Telemetry received.' });
  } catch (error: any) {
    console.error('Telemetry error:', error);
    res.status(500).json({ error: 'Internal server error processing telemetry' });
  }
});

router.get('/telemetry', (req: Request, res: Response) => {
  try {
    const logFile = path.resolve(process.cwd(), 'telemetry.log');
    if (!fs.existsSync(logFile)) {
      return res.status(200).json({ logs: [] });
    }
    
    const fileContent = fs.readFileSync(logFile, 'utf8');
    const logs = fileContent
      .split('\\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
      
    res.status(200).json({ logs });
  } catch (error: any) {
    console.error('Error reading telemetry:', error);
    res.status(500).json({ error: 'Internal server error reading telemetry' });
  }
});

export default router;

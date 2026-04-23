import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getPackageBySlug } from '../services/manifest';
import { renderConfigToml } from '../services/template';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/provision', async (req: Request, res: Response) => {
  try {
    const { package_slug, user_inputs } = req.body;

    if (!package_slug) {
      return res.status(400).json({ error: 'package_slug is required' });
    }

    const pkg = getPackageBySlug(package_slug);
    if (!pkg) {
      return res.status(404).json({ error: `Package not found: ${package_slug}` });
    }

    const inputs = user_inputs || {};
    
    // Validate required inputs
    const missingInputs = pkg.required_inputs.filter(reqInput => !inputs[reqInput]);
    if (missingInputs.length > 0) {
      return res.status(400).json({ 
        error: `Missing required inputs: ${missingInputs.join(', ')}` 
      });
    }

    const configToml = renderConfigToml(pkg, inputs);
    
    const payload = {
      package_slug: pkg.slug,
      config_toml: configToml,
      install_hooks: pkg.install_hooks || []
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }
    
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    res.json({
      success: true,
      token,
      message: 'Provisioning payload generated successfully.'
    });

    try {
      const { db } = require('../db');
      const { provisionLogs } = require('../db/schema');
      
      await db.insert(provisionLogs).values({
        jwtToken: token.substring(0, 50), // Store part of the token or all depending on need
        packageSlug: pkg.slug,
      });
    } catch (dbErr) {
      console.error('Failed to write to provision_logs in DB:', dbErr);
    }

  } catch (error: any) {
    console.error('Provisioning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/provision', (req: Request, res: Response) => {
  try {
    const logFile = path.resolve(process.cwd(), 'provision.log');
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
    console.error('Error reading provision logs:', error);
    res.status(500).json({ error: 'Internal server error reading provision logs' });
  }
});

export default router;

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { Package, getManifest } from './manifest';

export function renderConfigToml(pkg: Package, inputs: Record<string, string>): string {
  let templatePath = path.resolve(__dirname, '../templates/config.toml.hbs');
  if (!fs.existsSync(templatePath)) {
    templatePath = path.resolve(__dirname, '../../src/templates/config.toml.hbs');
  }
  const templateStr = fs.readFileSync(templatePath, 'utf-8');
  
  const template = Handlebars.compile(templateStr);
  
  const manifest = getManifest();
  
  return template({
    pkg,
    provider_defaults: manifest.provider_defaults,
    inputs
  });
}

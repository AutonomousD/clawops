import fs from 'fs';
import path from 'path';

export interface Package {
  slug: string;
  name: string;
  google_stack: Record<string, string>;
  required_inputs: string[];
  system_prompt: string;
  install_hooks: string[];
}

export interface Manifest {
  version: string;
  provider_defaults: Record<string, any>;
  packages: Package[];
}

export function getManifest(): Manifest {
  const manifestPath = path.resolve(__dirname, '../../../../packages/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  const rawData = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(rawData);
}

export function getPackageBySlug(slug: string): Package | undefined {
  const manifest = getManifest();
  return manifest.packages.find((pkg) => pkg.slug === slug);
}

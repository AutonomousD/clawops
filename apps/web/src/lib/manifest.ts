import fs from 'fs';
import path from 'path';

export interface PackageConfig {
  slug: string;
  name: string;
  price_gbp: number;
  billing_cycle: string;
  features: string[];
  google_stack: Record<string, string>;
  required_inputs: string[];
  system_prompt: string;
  install_hooks: string[];
}

export interface Manifest {
  version: string;
  provider_defaults: Record<string, any>;
  packages: PackageConfig[];
}

export function getManifest(): Manifest {
  // apps/web/src/lib/manifest.ts -> root is at ../../.. from src/lib, but relative to process.cwd() (which is apps/web) it's at ../../packages/manifest.json
  const manifestPath = path.join(process.cwd(), '../../packages/manifest.json');
  const fileContents = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(fileContents) as Manifest;
}

export function getPackageBySlug(slug: string): PackageConfig | undefined {
  const manifest = getManifest();
  return manifest.packages.find((pkg) => pkg.slug === slug);
}

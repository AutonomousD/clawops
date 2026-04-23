"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManifest = getManifest;
exports.getPackageBySlug = getPackageBySlug;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getManifest() {
    const manifestPath = path_1.default.resolve(__dirname, '../../../../packages/manifest.json');
    if (!fs_1.default.existsSync(manifestPath)) {
        throw new Error(`Manifest not found at ${manifestPath}`);
    }
    const rawData = fs_1.default.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(rawData);
}
function getPackageBySlug(slug) {
    const manifest = getManifest();
    return manifest.packages.find((pkg) => pkg.slug === slug);
}

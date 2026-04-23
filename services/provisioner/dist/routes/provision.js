"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const manifest_1 = require("../services/manifest");
const template_1 = require("../services/template");
const router = (0, express_1.Router)();
router.post('/provision', (req, res) => {
    try {
        const { package_slug, user_inputs } = req.body;
        if (!package_slug) {
            return res.status(400).json({ error: 'package_slug is required' });
        }
        const pkg = (0, manifest_1.getPackageBySlug)(package_slug);
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
        const configToml = (0, template_1.renderConfigToml)(pkg, inputs);
        const payload = {
            package_slug: pkg.slug,
            config_toml: configToml,
            install_hooks: pkg.install_hooks || []
        };
        const secret = process.env.JWT_SECRET || 'default-insecure-secret';
        const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '1h' });
        res.json({
            success: true,
            token,
            message: 'Provisioning payload generated successfully.'
        });
    }
    catch (error) {
        console.error('Provisioning error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

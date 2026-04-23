"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderConfigToml = renderConfigToml;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const manifest_1 = require("./manifest");
function renderConfigToml(pkg, inputs) {
    const templatePath = path_1.default.resolve(__dirname, '../templates/config.toml.hbs');
    const templateStr = fs_1.default.readFileSync(templatePath, 'utf-8');
    const template = handlebars_1.default.compile(templateStr);
    const manifest = (0, manifest_1.getManifest)();
    return template({
        pkg,
        provider_defaults: manifest.provider_defaults,
        inputs
    });
}

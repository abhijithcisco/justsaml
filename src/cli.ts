#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import { initCerts } from "./certs";
import { writeDefaultConfig } from "./config";
import { startServer } from "./index";

const args = process.argv.slice(2);
const command = args[0] || "help";

const configPath = args.includes("--config")
  ? args[args.indexOf("--config") + 1]
  : path.resolve(process.cwd(), "config.json");

const certsDir = path.resolve(path.dirname(configPath), "certs");

switch (command) {
  case "init": {
    console.log("Initializing JustSAML...\n");

    // Generate certs
    initCerts(certsDir);

    // Write default config if it doesn't exist
    if (!fs.existsSync(configPath)) {
      writeDefaultConfig(configPath);
      console.log(`\nCreated default config: ${configPath}`);
    } else {
      console.log(`\nConfig already exists: ${configPath}`);
    }

    console.log("\nDone! Edit config.json to add your Service Providers, then run:");
    console.log("  justsaml start\n");
    break;
  }

  case "start": {
    if (!fs.existsSync(configPath)) {
      console.error(`Config not found: ${configPath}`);
      console.error("Run 'justsaml init' first to generate certs and config.");
      process.exit(1);
    }
    startServer(configPath);
    break;
  }

  case "help":
  default: {
    console.log(`
JustSAML - The simplest SAML IdP for lab purposes

Usage:
  justsaml init              Generate certs and default config.json
  justsaml start             Start the SAML IdP server
  justsaml help              Show this help message

Options:
  --config <path>            Path to config.json (default: ./config.json)
`);
    break;
  }
}

#!/usr/bin/env node
/**
 * Post-install script that ensures ALL platform-specific native optional
 * dependencies are installed, even when the lockfile was generated on a
 * different platform.
 */
import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { platform as getPlatform, arch as getArch } from 'os';

const platform = getPlatform();
const arch = getArch();
const platformKeys = [];

if (platform === 'darwin') {
  platformKeys.push(`darwin-${arch}`, 'darwin-universal');
} else if (platform === 'win32') {
  platformKeys.push(`win32-${arch}-msvc`, `win32-${arch}`);
} else {
  // On Linux, the lockfile already has bindings from this repo
  console.log(`[native-bindings] ${platform} detected, all bindings already in lockfile`);
  process.exit(0);
}

console.log(`[native-bindings] Scanning for missing native bindings (${platform}-${arch})...`);

const modulesDir = join(process.cwd(), 'node_modules');
if (!existsSync(modulesDir)) {
  console.log('[native-bindings] node_modules not found, skipping');
  process.exit(0);
}

let installed = 0;

function canResolve(name) {
  try {
    createRequire(modulesDir).resolve(name);
    return true;
  } catch { return false; }
}

function checkPackage(pkgJsonPath) {
  if (!existsSync(pkgJsonPath)) return;
  try {
    const meta = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const opt = meta.optionalDependencies;
    if (!opt) return;
    for (const [depName, depVer] of Object.entries(opt)) {
      if (!platformKeys.some(k => depName.includes(k))) continue;
      if (canResolve(depName)) continue;
      const spec = `${depName}@${depVer}`;
      console.log(`[native-bindings] Installing ${spec}...`);
      try {
        execSync(`npm install "${spec}" --no-save --ignore-scripts --no-audit --no-fund`, {
          stdio: 'pipe', timeout: 120000
        });
        installed++;
        console.log(`[native-bindings] ✓ ${spec}`);
      } catch (err) {
        console.error(`[native-bindings] ✗ Failed: ${err.message}`);
      }
    }
  } catch {}
}

const entries = readdirSync(modulesDir);
for (const entry of entries) {
  const entryPath = join(modulesDir, entry);
  if (!statSync(entryPath).isDirectory()) continue;
  if (entry.startsWith('@')) {
    for (const sub of readdirSync(entryPath))
      checkPackage(join(entryPath, sub, 'package.json'));
  } else {
    checkPackage(join(entryPath, 'package.json'));
  }
}

if (installed > 0)
  console.log(`[native-bindings] Installed ${installed} missing native binding(s)`);
else
  console.log(`[native-bindings] All native bindings present`);

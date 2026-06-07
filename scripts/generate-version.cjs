const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const hash = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const version = { version: pkg.version, build: hash, timestamp: new Date().toISOString() }
fs.writeFileSync(path.join(__dirname, '..', 'public', 'version.json'), JSON.stringify(version, null, 2))
console.log('✅ version.json generated:', version.version, version.build)

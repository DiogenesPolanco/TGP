const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const pkg = require('../package.json')

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch {
    return 'unknown'
  }
}

const hash = git('rev-parse --short HEAD')
const branch = git('rev-parse --abbrev-ref HEAD')
const commitDate = git('log -1 --format=%cI')

const version = {
  version: pkg.version,
  build: hash,
  branch,
  timestamp: commitDate !== 'unknown' ? commitDate : new Date().toISOString(),
}

fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'version.json'),
  JSON.stringify(version, null, 2),
)
console.log(`✅ version.json generated: v${version.version} (${version.build}) on ${version.branch}`)

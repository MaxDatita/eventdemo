import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';

const PORT = process.env.PORT || '3000';

function getLanIp() {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    if (!entries) continue;
    for (const net of entries) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const lanIp = getLanIp();
if (lanIp) {
  console.log(`\nMobile URL: http://${lanIp}:${PORT}\n`);
} else {
  console.log('\nMobile URL: no se detecto una IP LAN.\n');
}

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'dev', '-H', '0.0.0.0', '-p', String(PORT)],
  { stdio: 'inherit', shell: false }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

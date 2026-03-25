import { spawn } from 'child_process';

console.log('Iniciando el Servidor Backend Local...');
const server = spawn(process.platform === 'win32' ? 'node' : 'node', ['server.js'], { stdio: 'inherit', shell: true });

console.log('Iniciando el Frontend Vite...');
const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  server.kill('SIGINT');
  vite.kill('SIGINT');
  process.exit();
});

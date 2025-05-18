import fs from 'fs';
import path from 'path';

const certsDir = path.join(__dirname, '..', '..', 'certs');

export const sslConfig = {
  key: fs.readFileSync(path.join(certsDir, 'key.pem')),
  cert: fs.readFileSync(path.join(certsDir, 'cert.pem')),
}; 
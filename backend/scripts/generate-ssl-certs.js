const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '..', 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate SSL certificates using OpenSSL
try {
  console.log('Generating SSL certificates...');
  
  // Generate private key
  execSync(`openssl genrsa -out ${path.join(certsDir, 'key.pem')} 2048`);
  
  // Generate CSR (Certificate Signing Request)
  execSync(`openssl req -new -key ${path.join(certsDir, 'key.pem')} \
    -out ${path.join(certsDir, 'csr.pem')} -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`);
  
  // Generate self-signed certificate
  execSync(`openssl x509 -req -days 365 -in ${path.join(certsDir, 'csr.pem')} \
    -signkey ${path.join(certsDir, 'key.pem')} -out ${path.join(certsDir, 'cert.pem')}`);
  
  // Clean up CSR file
  fs.unlinkSync(path.join(certsDir, 'csr.pem'));
  
  console.log('SSL certificates generated successfully!');
  console.log(`Certificates location: ${certsDir}`);
  console.log('\nTo trust these certificates on macOS:');
  console.log('1. Open Keychain Access');
  console.log('2. File > Import Items');
  console.log(`3. Navigate to ${certsDir}/cert.pem and import`);
  console.log('4. Double click the imported certificate');
  console.log('5. Expand the "Trust" section');
  console.log('6. Set "When using this certificate" to "Always Trust"');
} catch (error) {
  console.error('Error generating SSL certificates:', error.message);
  process.exit(1);
} 
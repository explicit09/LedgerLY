#!/bin/bash

# Create directories if they don't exist
mkdir -p backend/certs

# Generate SSL certificates using the Node.js script
cd backend && node scripts/generate-ssl-certs.js

echo "✅ SSL certificates generated successfully!"
echo "🔒 HTTPS is now configured for development."
echo "📝 Note: You may need to accept the self-signed certificate in your browser when you first access the site." 
# Data Encryption Implementation

## Overview
This document describes the encryption implementation for sensitive data in the LedgerLY application. The system uses AES-256-GCM encryption for encrypting sensitive fields at rest in the database.

## Encryption Service

The `EncryptionService` class provides methods for encrypting and decrypting sensitive data:

```typescript
class EncryptionService {
  // Encrypts a string value
  encrypt(text: string): string;
  
  // Decrypts an encrypted string
  decrypt(encryptedText: string): string;
  
  // Checks if a string is encrypted
  isEncrypted(value: string): boolean;
}
```

## Encrypted Fields

The following fields are automatically encrypted:

### User Model
- `resetToken`
- `verificationCode`

### Transaction Model
- `description`
- `category`
- `notes`

### PlaidItem Model
- `accessToken`
- `error`

## Prisma Middleware

The `encryptionMiddleware` automatically handles encryption/decryption of sensitive fields during database operations. It's integrated with the Prisma client in `src/lib/prisma.ts`.

## Security Considerations

- Uses AES-256-GCM encryption algorithm
- Each encryption operation generates a unique IV (Initialization Vector)
- Includes authentication tags to detect tampering
- Encryption key is loaded from environment variables
- Passwords are hashed (not encrypted) using bcrypt

## Testing

Tests are located in `tests/encryption.test.ts` and cover:
- Basic encryption/decryption
- Field-level encryption in database operations
- Error handling for invalid inputs

## Environment Variables

```env
# Required for encryption
ENCRYPTION_KEY=your-secure-encryption-key
```

## Adding New Encrypted Fields

1. Add the field to the appropriate model in `prisma/schema.prisma`
2. Add the field name to the `ENCRYPTED_FIELDS` constant in `src/middleware/encryption.middleware.ts`
3. Update the documentation above
4. Add tests for the new encrypted field

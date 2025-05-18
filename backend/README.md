# LedgerLY Backend

This is the backend service for the LedgerLY personal finance management application. It provides a RESTful API for managing financial data, user authentication, and third-party integrations.

## Features

- **User Authentication**: JWT-based authentication system
- **Database**: PostgreSQL with Sequelize ORM
- **AWS Integration**: Secure secret management with AWS Secrets Manager
- **Plaid Integration**: Connect bank accounts and retrieve transaction data
- **Scheduled Jobs**: Automatic transaction syncing on a configurable schedule
- **RESTful API**: Clean, well-documented API endpoints
- **Logging**: Comprehensive logging with Winston and CloudWatch
- **Security**: Helmet, CORS, rate limiting, and input validation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- AWS Account with appropriate permissions
- AWS CLI configured with credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ledgerly.git
cd ledgerly/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and update it with your configuration:

```bash
cp ../../.env.example .env
```

Edit the `.env` file with your specific configuration.

### 4. Set Up AWS Secrets (Optional for Local Development)

For local development, you can use the provided script to set up AWS Secrets Manager:

```bash
npm run secrets:setup
```

This will create the necessary IAM policies, roles, and sample secrets in AWS Secrets Manager.

### 5. Database Setup

Make sure PostgreSQL is running, then create the database and run migrations:

```bash
# Create the database (if it doesn't exist)
createdb ledgerly_dev

# Run database migrations
npx prisma migrate dev
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### 7. Transaction Sync Scheduler

The application includes a transaction sync scheduler that automatically fetches new transactions from Plaid on a configurable schedule.

#### Configuration

Configure the scheduler in your `.env` file:

```env
# Set to 'true' to enable the transaction sync scheduler
ENABLE_TRANSACTION_SYNC=true

# Cron expression for scheduling (default: every hour at minute 0)
TRANSACTION_SYNC_CRON=0 * * * *

# Number of days to look back for initial sync (if no lastSyncAt is set)
TRANSACTION_SYNC_LOOKBACK_DAYS=30
```

#### Testing the Scheduler

To test the scheduler locally, you can use the test script:

```bash
npm run test:scheduler
```

This will start the scheduler with a 30-second interval for testing purposes.

For more details, see the [scheduler documentation](./src/services/scheduler/README.md).

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/       # Request handlers
│   ├── database/          # Database models and migrations
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic and external services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express application setup
│   └── server.ts          # Server entry point
├── prisma/                # Prisma schema and migrations
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── .env.example           # Example environment variables
├── package.json           # Project dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Available Scripts

- `npm run start:dev`: Start the development server with hot-reload
- `npm run start:prod`: Start the production server
- `npm run build`: Compile TypeScript to JavaScript
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run secrets:setup`: Set up AWS Secrets Manager for the application
- `npm run secrets:test`: Test the AWS Secrets Manager integration
- `npm run secrets:list`: List all secrets in AWS Secrets Manager

## Environment Variables

See [.env.example](../.env.example) for a complete list of environment variables that can be set.

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode.

## Testing

To run the test suite:

```bash
npm test
```

## Deployment

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Docker (for containerized deployment)

### Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   ```bash
   export NODE_ENV=production
   # Set other production environment variables
   ```

3. **Deploy to your preferred platform** (AWS ECS, EKS, etc.)

## Security

- All sensitive data is stored in AWS Secrets Manager
- JWT tokens are used for authentication
- Rate limiting is enabled to prevent abuse
- Input validation is performed on all API endpoints
- Security headers are set using Helmet

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

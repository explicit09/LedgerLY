# Transaction Sync Scheduler

This module provides a scheduled job for syncing transactions from Plaid for all linked accounts.

## Features

- Scheduled transaction sync using cron expressions
- Configurable sync frequency via environment variables
- Automatic retry on failure
- Prevents overlapping syncs
- Graceful shutdown handling

## Configuration

Configure the scheduler using the following environment variables in your `.env` file:

```env
# Set to 'true' to enable the transaction sync scheduler
ENABLE_TRANSACTION_SYNC=true

# Cron expression for scheduling transaction sync (default: every hour at minute 0)
TRANSACTION_SYNC_CRON=0 * * * *

# Number of days to look back for initial sync (if no lastSyncAt is set)
TRANSACTION_SYNC_LOOKBACK_DAYS=30
```

## Usage

The scheduler is automatically started when the application starts if `ENABLE_TRANSACTION_SYNC` is set to `true`.

### Manual Trigger

You can also trigger a manual sync by calling the `syncAllAccounts()` method:

```typescript
import { transactionSyncScheduler } from './services/scheduler';

// Trigger a manual sync
await transactionSyncScheduler.syncAllAccounts();
```

### Testing

To test the scheduler locally, you can use the test script:

```bash
npm run test:scheduler
```

This will start the scheduler with a 30-second interval for testing purposes.

## Implementation Details

The scheduler uses the following flow:

1. On schedule, it retrieves all active Plaid items from the database
2. For each item, it determines the date range to sync (since last sync or initial lookback period)
3. It fetches transactions from Plaid using the Plaid API
4. It processes and saves the transactions to the database
5. It updates the last sync time for the item

## Error Handling

- If an error occurs during sync for a specific item, it logs the error and continues with the next item
- If a critical error occurs, it's logged and the scheduler will retry on the next scheduled run
- The scheduler prevents concurrent runs to avoid race conditions

## Monitoring

All scheduler activities are logged using the application logger. You can monitor the logs to track sync status and any issues that may occur.

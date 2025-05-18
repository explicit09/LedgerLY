# Plaid Webhook API Documentation

This document describes the Plaid webhook API endpoints for handling Plaid webhook events.

## Base URL

```
POST /api/plaid/webhook
```

## Webhook Payload

### Request

```http
POST /api/plaid/webhook
Content-Type: application/json

{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "DEFAULT_UPDATE",
  "item_id": "wz666MBjYWTp2PDzzggYhM6oWWmBb",
  "new_transactions": 5,
  "removed_transactions": ["t1", "t2"],
  "error": null
}
```

### Supported Webhook Types

#### Transactions Webhooks

- `DEFAULT_UPDATE` - New transactions are available
- `TRANSACTIONS_REMOVED` - Transactions have been removed
- `SYNC_UPDATES_AVAILABLE` - New transactions are available (after initial sync)

#### Item Webhooks

- `ERROR` - An error occurred with the item
- `PENDING_EXPIRATION` - The access token will expire soon
- `USER_PERMISSION_REVOKED` - User has revoked access
- `WEBHOOK_UPDATE_ACKNOWLEDGED` - Webhook URL was updated

## Error Responses

### 400 Bad Request

Returned when there's an issue with the webhook payload or the item is in an error state.

```json
{
  "status": "error",
  "message": "Item error message",
  "errorCode": "ITEM_LOGIN_REQUIRED"
}
```

### 401 Unauthorized

Returned when the webhook signature verification fails.

```json
{
  "status": "error",
  "message": "Invalid webhook signature"
}
```

### 429 Too Many Requests

Returned when the rate limit has been exceeded.

```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error

Returned when an unexpected error occurs.

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

## Webhook Implementation Details

### Security

- All webhook requests are verified using the `PLAID_WEBHOOK_SECRET`
- The webhook endpoint only accepts POST requests with a valid JSON payload
- Sensitive data is redacted from logs

### Error Handling

- Item-level errors (e.g., login required) are logged and the item is marked as needing attention
- Rate limit errors are handled with appropriate retry-after headers
- Unexpected errors are logged with detailed context for debugging

### Transaction Processing

1. For `DEFAULT_UPDATE` webhooks:
   - New transactions are fetched from Plaid
   - Transactions are processed and stored in the database
   - Account balances are updated

2. For `TRANSACTIONS_REMOVED` webhooks:
   - The specified transactions are marked as removed in the database
   - Account balances are recalculated

3. For `SYNC_UPDATES_AVAILABLE` webhooks:
   - A background job is queued to fetch the latest transactions
   - The job runs with lower priority to avoid rate limiting

### Retry Logic

- Failed webhook processing is retried with exponential backoff
- Plaid's recommended retry logic is followed for rate limits
- Permanent errors are logged and no retry is attempted

## Testing

### Test Webhooks

You can test webhooks using the Plaid Sandbox environment. The following test webhook codes are supported:

- `SANDBOX` - Simulates a successful webhook
- `DEFAULT_UPDATE` - Simulates new transactions
- `TRANSACTIONS_REMOVED` - Simulates removed transactions
- `ERROR` - Simulates an item error

### Example Test Request

```bash
curl -X POST https://your-api-url.com/api/plaid/webhook \
  -H "Content-Type: application/json" \
  -d '{"webhook_type":"TRANSACTIONS","webhook_code":"DEFAULT_UPDATE","item_id":"test-item-id"}'
```

## Monitoring and Alerts

- All webhook processing is logged with appropriate log levels
- Errors are reported to the monitoring system
- Rate limit warnings are triggered when approaching limits
- Item errors trigger notifications to the support team

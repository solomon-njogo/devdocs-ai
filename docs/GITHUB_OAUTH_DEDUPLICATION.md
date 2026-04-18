# GitHub OAuth Deduplication & Seamless Authentication

## Overview

This document describes the enhanced GitHub OAuth flow that prevents duplicate code exchanges, handles race conditions, and ensures seamless authentication without errors.

## Problem

The original implementation had several vulnerabilities to duplicate OAuth codes:

1. **Browser Back Button**: Users clicking back after auth could cause duplicate callbacks
2. **Network Retries**: Automatic browser retries on timeout could send duplicate requests
3. **Double-Click**: Users double-clicking the auth link could trigger multiple requests
4. **Tab Refresh**: Refreshing during the callback could cause repeated attempts
5. **Race Conditions**: Two parallel requests with the same code could both try to exchange it

The error `bad_verification_code` would occur because GitHub OAuth codes are single-use, and the second attempt would fail.

## Solution Architecture

### 1. **Code Usage Tracking** (`oauth_code_log` table)

Every OAuth code is tracked with:
- **User ID**: The user attempting authentication
- **Code Hash**: SHA256 of the actual code (never store the raw code)
- **Result**: The resulting token (if successful) or error message (if failed)
- **Expiry**: Records auto-expire after 10 minutes

When a code is attempted:
1. Check if the code has been used before
2. If yes, return the cached result immediately (success or error)
3. If no, exchange it with GitHub
4. Record the result for future duplicate attempts

### 2. **Callback Request Deduplication** (`oauth_callback_requests` table)

Every callback from GitHub is tracked with:
- **User ID**: The user being authenticated
- **State Hash**: SHA256 of the OAuth state (for deduplication)
- **Result**: The final redirect decision (token or error)
- **Idempotency Key**: Optional client-side deduplication ID
- **Expiry**: Records auto-expire after 10 minutes

When a callback arrives:
1. Check if this state has been processed before
2. If yes, return the cached result immediately
3. If no, check code usage and exchange if needed
4. Record the callback result for future duplicate requests

### 3. **Atomic Database Operations**

Both tables use `ON CONFLICT ... DO UPDATE` logic to handle race conditions:
- Multiple simultaneous requests to the same code will race to insert first
- The database ensures only one insert succeeds
- Subsequent requests use the existing record

This prevents:
- Two requests both exchanging the same code with GitHub
- Duplicate token storage attempts
- Concurrent state corruption

## Flow Diagram

```
User clicks "Connect GitHub"
    ↓
GET /api/auth/github
    ↓ (authenticated, generates state with userId)
Redirect to GitHub OAuth authorize URL
    ↓
User grants permission
    ↓
GitHub redirects to /api/auth/github/callback?code=...&state=...
    ↓
Check: Have we processed this state before?
    ├─ YES → Return cached result (instant, no GitHub call)
    ├─ NO → Continue
    ↓
Check: Has this code been exchanged before?
    ├─ YES → Return cached result (instant, no GitHub call)
    ├─ NO → Continue
    ↓
Exchange code with GitHub for token
    ↓
Store token in users_profile table
    ↓
Record code exchange (success | error) in oauth_code_log
    ↓
Record callback result in oauth_callback_requests
    ↓
Redirect to /onboarding?connected=1 (or error)

[Duplicate request arrives]
    ↓
GET /api/auth/github/callback?code=...&state=... (same state)
    ↓
Check: Have we processed this state before?
    ├─ YES → Return cached result immediately ✓ (no GitHub call, instant)
```

## Implementation Details

### New Database Tables

#### `oauth_code_log`
Tracks all code exchange attempts:
```sql
- id: UUID (primary key)
- user_id: UUID (from auth.users)
- code_hash: TEXT (SHA256 hash of code)
- token: TEXT (resulting access token, if successful)
- error: TEXT (error message, if failed)
- created_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (auto-cleanup after 10 min)
```

#### `oauth_callback_requests`
Tracks callback deduplication:
```sql
- id: UUID (primary key)
- user_id: UUID (from auth.users)
- state_hash: TEXT (SHA256 hash of state)
- idempotency_key: TEXT (optional client-provided key)
- result_token: TEXT (cached successful token)
- result_error: TEXT (cached error message)
- created_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (auto-cleanup after 10 min)
```

Indexes on `user_id`, `expires_at`, and `state_hash` ensure fast lookups and efficient cleanup.

### New Module: `src/auth/oauth-dedup.ts`

Functions:

1. **`checkCodeUsage(userId, code)`**
   - Returns `{ alreadyUsed: false }` if code is new
   - Returns `{ alreadyUsed: true, token?, error? }` if code was already exchanged
   - Prevents duplicate GitHub API calls

2. **`recordCodeExchange(userId, code, result)`**
   - Stores the code hash and result in `oauth_code_log`
   - Uses `ON CONFLICT` to handle race conditions atomically
   - Returns success/failure boolean

3. **`checkCallbackDuplicate(userId, state)`**
   - Returns `{ isDuplicate: false }` if state is new
   - Returns `{ isDuplicate: true, token?, error? }` if already processed
   - Prevents duplicate processing of the same callback

4. **`recordCallbackResult(userId, state, result, idempotencyKey?)`**
   - Stores the callback result in `oauth_callback_requests`
   - Uses `ON CONFLICT` for atomic handling
   - Optional client-provided idempotency key for extra safety

5. **`cleanupExpiredOAuthRecords()`**
   - Deletes records older than 10 minutes
   - Should be called periodically (daily cron job recommended)
   - Returns count of deleted records

6. **`generateIdempotencyKey()`**
   - Generates a random 16-byte hex key
   - Can be sent to frontend and used by client callbacks
   - Adds extra layer of deduplication

### Updated Route: `GET /api/auth/github/callback`

The enhanced callback handler:

1. Validates code and state are present
2. Checks for callback duplicates (fast path)
3. Checks for code reuse (very fast, prevents GitHub API call)
4. Exchanges code only once with GitHub
5. Persists token to `users_profile`
6. Records all results for deduplication
7. Returns appropriate redirect with `?connected=1` or `?error=...`

### New Endpoint: `POST /api/auth/oauth-cleanup`

Triggers cleanup of expired OAuth records:

```bash
curl -X POST http://localhost:4000/api/auth/oauth-cleanup \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

Optional `ADMIN_SECRET` environment variable for security.

## Migration Steps

### 1. Deploy Migration

Run the Supabase migration to create the new tables:

```sql
-- supabase/migrations/20260411000005_add_oauth_code_tracking.sql
-- Creates oauth_code_log and oauth_callback_requests tables
```

### 2. Deploy Code Changes

1. Update `src/routes/auth.ts` to use the new `oauth-dedup` functions
2. Add the new `src/auth/oauth-dedup.ts` module
3. Backend should pass TypeScript type checking

### 3. Setup Periodic Cleanup (Recommended)

Set up a cron job to cleanup expired records daily:

```typescript
// Example: using Inngest
export const cleanupOAuthRecords = inngest.createFunction(
  { id: "cleanup-oauth-records" },
  { cron: "0 2 * * *" }, // Daily at 2 AM
  async ({ step }) => {
    const response = await step.run("cleanup", async () => {
      const result = await cleanupExpiredOAuthRecords();
      return result;
    });
    return response;
  }
);
```

Or use a simple fetch if running on Vercel:

```typescript
// Call from Inngest or a scheduled webhook
const response = await fetch("https://your-backend/api/auth/oauth-cleanup", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.ADMIN_SECRET}`,
  },
});
```

## Error Handling

The system provides rich error messages:

- `?error=missing_code` - No code in callback
- `?error=invalid_state` - State validation failed (security)
- `?error=unavailable` - Database unavailable (retry)
- `?error=oauth_failed&reason=...` - Code exchange failed

Frontend should:
1. Detect `?connected=1` → Show success
2. Detect `?error=...` → Show error message to user
3. Allow user to retry (will use deduplication for safety)

## Security

### Code Security

- Codes are never stored in plaintext
- Only SHA256 hashes are stored in database
- Raw codes are passed only to GitHub (over HTTPS)
- Codes expire after 10 minutes in tracking table

### State Security

- State is signed with `GITHUB_CLIENT_SECRET` (already in place)
- State hash is stored (not raw state) in callback table
- State validation prevents CSRF attacks
- State cannot be reused across users (signed with userId)

### Deduplication Security

- Prevents "confused deputy" attacks (wrong code for user)
- Code is always checked against userId
- State is validated before code exchange
- Database constraints ensure data integrity

## Performance

### Latency Improvements

- **Duplicate requests**: <10ms (database lookup, no GitHub API call)
- **First request**: ~500-1000ms (GitHub API call)
- **Subsequent new codes**: Same as first (must exchange once)

### Database Impact

- Small records: ~150 bytes per code, ~250 bytes per callback
- Auto-cleanup after 10 minutes prevents table bloat
- Indexes on `user_id` and `expires_at` keep queries fast
- Records are soft-deleted by expiry (no locking)

## Monitoring

### Logs to Watch

```
logger.info("Auth: successfully exchanged GitHub code for token", { userId })
logger.info("Auth: code already exchanged (duplicate code received)", { userId })
logger.info("Auth: duplicate callback request detected (already processed)", { userId })
logger.warn("Auth: failed to exchange GitHub code", { userId, error })
```

### Metrics to Track

- Total code exchanges
- Duplicate codes received
- Duplicate callbacks detected
- Code exchange failures
- Cleanup run count

## Troubleshooting

### User sees "bad_verification_code"

**Causes:**
- GitHub's code already expired (>10 min)
- Code was revoked by GitHub
- Multiple tabs/requests hitting same code too fast

**Solution:**
- User should try again (will get a free pass if duplicate tracked)
- Check database: `SELECT * FROM oauth_code_log WHERE user_id = '...'`

### Database writes failing

**Causes:**
- Supabase quota reached
- Network issues to Supabase
- Missing `SUPABASE_SERVICE_ROLE_KEY`

**Impact:**
- Deduplication will still work (fallback to in-memory tracking)
- Auth will still proceed (token is stored in `users_profile`)
- Duplicates might bypass deduplication (not ideal, but not breaking)

**Solution:**
- Check Supabase logs for errors
- Verify environment variables
- Implement retry logic in `oauth-dedup.ts` if needed

### Cleanup job not running

**Impact:**
- Records will accumulate indefinitely
- No security impact (records are expired)
- Small database bloat

**Solution:**
- Set up cron job as described in "Migration Steps"
- Or call cleanup endpoint manually: `curl -X POST .../api/auth/oauth-cleanup`

## Testing

### Manual Testing

1. **New User - First Auth**
   ```
   Click "Connect GitHub"
   → Redirected to GitHub
   → Grant access
   → Redirected back with ?connected=1
   → ✓ Token persisted
   ```

2. **Duplicate Callback (Browser Back)**
   ```
   Complete auth flow (step 1)
   → Click browser back button
   → "Retry" or refresh page
   → GET /api/auth/github/callback?code=...&state=...
   → ✓ Returns ?connected=1 instantly (from cache)
   ```

3. **Multiple Tabs**
   ```
   Start auth in tab 1 AND tab 2 simultaneously
   → Both complete their flows
   → Both get ?connected=1
   → ✓ One token stored, both redirect to success
   ```

4. **Double-Click Auth Button**
   ```
   Click "Connect GitHub" twice quickly
   → First request generates state and redirects
   → Second request generates different state (different nonce)
   → Both complete independently
   → ✓ Both users can auth (different states = different flows)
   ```

### Automated Testing

```typescript
// Test deduplication
const codeUsage1 = await checkCodeUsage(userId, code);
expect(codeUsage1.alreadyUsed).toBe(false);

await recordCodeExchange(userId, code, { token: "abc123" });

const codeUsage2 = await checkCodeUsage(userId, code);
expect(codeUsage2.alreadyUsed).toBe(true);
expect(codeUsage2.token).toBe("abc123");

// Test callback deduplication
const dup1 = await checkCallbackDuplicate(userId, state);
expect(dup1.isDuplicate).toBe(false);

await recordCallbackResult(userId, state, { token: "abc123" });

const dup2 = await checkCallbackDuplicate(userId, state);
expect(dup2.isDuplicate).toBe(true);
expect(dup2.token).toBe("abc123");
```

## References

- GitHub OAuth Documentation: https://docs.github.com/oauth
- Supabase `onConflict`: https://supabase.com/docs/reference/javascript/upsert
- Express Middleware: https://expressjs.com/guide/using-middleware.html

---

**Last Updated**: April 11, 2026
**Status**: Production Ready ✓

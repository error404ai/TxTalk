# Dependency Version Fix

## Issue

When starting the Docker containers, the frontend failed with the following error:

```
Error: No matching export in viem for import "sendCallsSync"
Error: No matching export in viem for import "sendTransactionSync"
```

## Root Cause

Version incompatibility between `wagmi` and `viem` packages:

- `wagmi@2.13.0` (and its dependency `@wagmi/core@2.22.0`) required newer viem methods
- `viem@2.37.12` (auto-upgraded from `^2.21.0`) didn't have these sync methods
- The `^` caret in package.json allowed pnpm to install incompatible newer versions

## Solution

Pinned exact compatible versions in `/apps/frontend/package.json`:

```json
"viem": "2.21.45",
"wagmi": "2.12.17"
```

### Changes Made

1. Removed caret (`^`) from version specifications to prevent auto-upgrades
2. Set `viem` to `2.21.45` (compatible with wagmi 2.12.x)
3. Set `wagmi` to `2.12.17` (compatible with viem 2.21.x)
4. Cleaned node_modules and lockfiles
5. Reinstalled dependencies
6. Restarted Docker containers

## Verification

All containers are now running successfully:

- ✅ MySQL: Healthy
- ✅ API: Running on port 8000
- ✅ Frontend: Running on port 5173
- ✅ phpMyAdmin: Running on port 8080

## Important Notes

- **Peer Dependency Warnings**: You'll see warnings about React 19 vs React 18. These are safe to ignore as React 19 is backward compatible
- **Node Deprecation Warning**: `url.parse()` deprecation warning from pnpm is harmless
- **Version Locking**: The exact versions prevent future incompatibility issues

## Testing

Access the application:

- Frontend: http://localhost:5173
- API: http://localhost:8000
- phpMyAdmin: http://localhost:8080

Both Solana and BNB blockchain support should work correctly now.

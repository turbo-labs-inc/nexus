# Cypress Testing Guide for Nexus

## Quick Start

If you're experiencing Cypress spinning indefinitely, run:

```bash
npm run cypress:now
```

This will:
1. Disable middleware that causes spinning issues
2. Start Next.js with special testing flags
3. Launch Cypress 

## Fixed Issues

We've fixed two critical issues:

1. **ReferenceError in Workflow Designer**: Fixed a bug where `executionContextRef` was being used before it was initialized, causing a 500 error when Cypress loaded the workflow-designer test page.

2. **Environment and Middleware Issues**: Added proper handling to bypass authentication during testing and created dedicated test environments.

## Testing Commands

- `npm run cypress:now` - Quick fix to get Cypress running immediately
- `npm run cypress:fix` - Apply comprehensive fixes to the codebase
- `npm run e2e` - Run tests in interactive mode (after fixes)
- `npm run e2e:headless` - Run tests in headless mode (after fixes)

## Implementation Plan

See [CYPRESS_FIX_PLAN.md](./CYPRESS_FIX_PLAN.md) for a detailed implementation plan.

## Troubleshooting

If you're still experiencing issues:

1. Make sure your environment variables are properly set up
2. Try killing any stray Next.js processes with `pkill -f "next dev"`
3. Check that port 3131 is available (`lsof -i :3131`)
4. Try directly running Cypress after manually starting the dev server:
   ```bash
   # Terminal 1
   NEXT_DISABLE_MIDDLEWARE=1 npm run dev
   
   # Terminal 2
   npx cypress open
   ```

## Checking for Other Code Issues

If you encounter more 500 errors, check the browser console or server logs for specific errors. Common issues include:

1. Using variables before they're initialized (like we fixed in workflow-designer.tsx)
2. Missing environment variables
3. Middleware authentication loops
4. Invalid component props

The fix script (`cypress:fix`) will address most of these issues, but some may require specific code fixes like the ReferenceError we fixed in the workflow designer component.

## Why It Was Spinning

The spinning was caused by:

1. A ReferenceError in the workflow-designer component causing 500 errors
2. Authentication middleware that wasn't properly bypassed during testing
3. Outdated Cypress experimental flags
4. Race conditions between Next.js startup and Cypress
5. Missing environment variables

The fixes address all these issues and provide a more reliable testing setup.
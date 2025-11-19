# TypeScript Fixes for Phase 2 Services

## Overview
This document tracks TypeScript compilation errors that need fixing before tests can run.

## Errors to Fix

### pollingService.ts
- [x] Line 127: `(acc, r)` → `(acc, r: any)`
- [x] Line 140: `(sum, r)` → `(sum: number, r: any)`
- [x] Line 223: `(r)` → `(r: any)`
- [x] Line 229: `(r)` → `(r: any)`
- [x] Line 281: `(response)` → `(response: any)`

### stanceService.ts
- [ ] Line 98: Add type annotation

### surveyService.ts
- [ ] Line 208: Add type annotation
- [ ] Line 267: Add type annotation

### swipeService.ts
- [ ] Multiple lines: Add type annotations

### votingRecordService.ts
- [ ] Line 4: Vote import issue (requires Prisma generation)
- [ ] Line 139-140: Add type annotations
- [ ] Line 166: Add type annotation

### types/api.ts
- [ ] Line 1: Prisma imports (requires Prisma generation)

## Note
Some errors require Prisma client generation which cannot be done in this environment.
We'll add `any` type annotations as a temporary solution to allow tests to run.

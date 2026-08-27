# Portable database architecture

## What is included

The portable replica uses `Backend/data/db.json`, a UTF-8 JSON document store. It is intentionally local and dependency-free: no MongoDB, Redis, SQL server, cloud database, or network connection is required to start the bundle.

Collections currently stored in the document are:

- `users`: credentials, profile, status, balances, VIP level, invite code, online state
- `orders`: order/product references, prices, commissions, user, status, timestamps
- `recharges`: deposits, amount, currency, transaction ID, approval status
- `withdraws`: withdrawal amount, destination address, user, status
- `vipList`: level thresholds, commission rates, daily limits
- `config`, `news`, `help`, `certificates`, `checkins`, `rewardClaims`

## Consistency and recovery

All API handlers read the same database path, whether called from the client server (port 3000) or admin server (port 8080). Writes are serialized to `db.json.tmp`, the previous file is copied to `db.json.bak`, and the temporary file is renamed into place. This prevents a process interruption from leaving a half-written JSON document.

## Authentication boundaries

- Frontend fixture login: `testuser / password123`; the returned token is matched against `users[].token`.
- Admin login: `admin / erpkl123123` locally; the server issues an HttpOnly `local_admin_session` cookie held in memory.
- Admin sessions are deliberately not persisted in the database and are cleared by logout or process restart.

## NoSQL classification

This is document-oriented storage (NoSQL-like shape), but it is not a production multi-user NoSQL engine. It is suitable for portable demos, UI testing, and deterministic smoke tests. For deployment with concurrent writers, auditing, replication, or large datasets, migrate the same collections to MongoDB, CouchDB, or PostgreSQL JSONB and replace `readDb`/`writeDb` with a transactional repository.

## Backup and restore

Stop the local servers before copying `Backend/data/db.json`. The most recent pre-write version is automatically retained as `Backend/data/db.json.bak`. To restore, replace `db.json` with the backup and restart both servers.

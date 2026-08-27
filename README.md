# Visual local replica

This directory is the complete local project root. Copy or move the entire
`Visual` folder anywhere on a Windows machine; active source files do not
depend on the original machine location.

The folder also includes `system/nodejs/node.exe` (Node.js 24.19.0), and the
launchers prefer that bundled runtime automatically.

Run `powershell -ExecutionPolicy Bypass -File .\verify_portable.ps1` from the
folder to check the bundled runtime, required files, both servers, both login
flows, and an admin route. It prints `Result: PASS` on success and stops its
temporary test processes automatically.

## Start both applications

Double-click `launch_all.bat`, or run it from Command Prompt. It prompts for a
local administrator password and starts:

- Client: `http://127.0.0.1:3000`
- Admin: `http://127.0.0.1:8080/admin.html`

The password is supplied only to the running process through
`LOCAL_ADMIN_PASSWORD`; it is not written into project files.

## Project layout

- `Client/` — browser-visible client build and a local static/API server.
- `Backend/` — local admin build, its server, and `data/db.json` fixtures.
- `reference-mirror-admin-20260826/` — captured admin reference pages.
- `Backend-admin-before-reference-20260826/` — preserved pre-refresh backup.

The client and admin use the same handler at `Backend/api_handler.js`, so their
local API behavior and fixture data stay synchronized. No process needs to be
running before the folder is copied. The normal batch launcher uses the
installed/default browser; `launch.js` additionally requires the Playwright
browser package already used by the development launcher.

## Feature catalogue

`FEATURE_CATALOG.md` is the implementation map for the visible client and admin
surfaces. It includes the Chinese labels and member operations, route mapping,
5W1H acceptance checks, MECE domains, first-principles state/ledger rules,
second-order effects, inversion safeguards, and the GYEFIN (Goals, Why, Events,
Functions, Information, Non-functionals) lens. It also states which production
integrations cannot be reproduced without private backend contracts or credentials.

`LABEL_RELATIONSHIP_CATALOG.md` expands the admin inventory beyond the member page;
`CLIENT_LABEL_RELATIONSHIP_CATALOG.md` maps client words, icons, cards, tabs, forms,
and buttons to their admin data sources, projections, and state transitions.

`PARITY_MATRIX.md` records which surfaces were checked against the live production
browser and which behaviors are verified only in the local fixture replica.

`SYSTEM_PROTOCOL_AUDIT.md` traces labels through frontend events, transport,
backend state transitions, persistence, projection refresh, and failure safeguards.

`HUMAN_VIEW_ALL_LABEL_AUDIT.md` documents real Chromium rendering across every
captured admin route, with screenshots and visible-control evidence in
`visual_audit_screenshots/`.

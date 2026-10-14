# Core platform (Phase 1)

## US-01: Sign in

**As the** owner, **I want to** sign in with a passkey, or a password plus TOTP, **so that** only I can open Fiscus. Priority: Must

- **AC-01.1 (happy path)** **Given** I am on my tailnet with a registered passkey, **when** I sign in with it, **then** I land on the page I opened, or on the start page, and the session lasts 30 days on that device.
- **AC-01.2 (negative)** **Given** 5 wrong TOTP codes within 15 minutes, **when** I try a sixth time, **then** sign-in is refused for 15 minutes and the attempts are in the audit log.
- **AC-01.3 (negative)** **Given** a request from outside the tailnet, **when** it asks for any path except the ingest endpoint, **then** it gets 404.

## US-02: Recover access

**As the** owner, **I want** recovery codes and a server reset command, **so that** losing my phone does not lock me out. Priority: Must

- **AC-02.1 (happy path)** **Given** I lost my passkey device, **when** I sign in with my password and an unused recovery code, **then** I am in, the code is burned, and I am asked to register a new passkey or TOTP.
- **AC-02.2 (negative)** **Given** a recovery code was already used, **when** I enter it again, **then** sign-in is refused with "This code was already used".
- **AC-02.3 (happy path)** **Given** SSH access to the VPS, **when** I run the reset command, **then** all sessions and second factors are cleared and a one-time sign-in link valid for 15 minutes is printed.

## US-03: Manage API tokens

**As the** owner, **I want to** create scoped, expiring tokens, **so that** scripts and agents get only the access they need. Priority: Must

- **AC-03.1 (happy path)** **Given** I create a token with scope `fiscus:ingest` and a 90-day expiry, **when** I save it, **then** its value is shown once, and afterwards only its name, scope, expiry and last-used time are shown.
- **AC-03.2 (negative)** **Given** a revoked token, **when** a client calls with it, **then** the call fails with 401 and nothing is written.
- **AC-03.3 (negative)** **Given** a `fiscus:read` token, **when** a client tries to create a transaction, **then** the call fails with 403.

## US-04: Find and open pages

**As the** owner, **I want** a command palette over every page of the app, **so that** any page is two keystrokes away. Priority: Must

- **AC-04.1 (happy path)** **Given** the app is open, **when** I press Ctrl/Cmd + K and type "review", **then** Review is the first result and Enter opens it.
- **AC-04.2 (negative)** **Given** a module is disabled in config, **when** I search for its pages, **then** they do not appear and its routes return 404.

## US-05: Trust my backups

**As the** owner, **I want** nightly off-site backups with a visible status, **so that** losing the VPS never loses my data. Priority: Must

- **AC-05.1 (happy path)** **Given** last night's backup succeeded, **when** I open the System page, **then** I see its time, size and snapshot id.
- **AC-05.2 (negative)** **Given** no successful backup in the past 26 hours, **when** the hourly check runs, **then** I get an alert email and the System page shows the error.

## US-06: Export my data

**As the** owner, **I want to** export every module's data in open formats, **so that** I am never locked in. Priority: Should

- **AC-06.1 (happy path)** **Given** I request a full export, **when** it finishes, **then** I can download one ZIP with CSV and JSON per module and a manifest of row counts.
- **AC-06.2 (negative)** **Given** an export is already running, **when** I request another, **then** it is refused with "An export is already running".

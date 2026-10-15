# 2. Actors & access matrix (RBAC)

There is one human account; every other actor is a token or a system job, and each gets only the access its column shows.

## 2.1 Actors

| Actor | Type | Description |
| --- | --- | --- |
| Owner | Human | You, the only account. Signs in over Tailscale with a passkey, or a password plus TOTP |
| Local client | System | A script or tool on a device in your tailnet, using a private token with any of `fiscus:read`, `fiscus:write` and `fiscus:settings` |
| Phone app | System | The Fiscus app on your phone, paired by QR code (FR-34). It holds a token with `fiscus:read`, `fiscus:write` and `fiscus:settings`, and syncs only through Tailscale (A-15) |
| Ingest client | System | Anything outside the tailnet (a cloud agent, a phone shortcut, your exporter skill) calling the public ingest endpoint with a `fiscus:ingest` token |
| Scheduler | System | pg-boss jobs inside Fiscus: cycle opening, recurring transactions, trash purge, file cleanup, backups, alerts |
| Backup target | External system | The Backblaze B2 bucket that receives encrypted restic snapshots (assumes A-06) |

## 2.2 Permission matrix

| Action / resource | Owner (session) | Token `fiscus:read` | Token `fiscus:write` | Token `fiscus:settings` | Token `fiscus:ingest` (public) | Scheduler |
| --- | --- | --- | --- | --- | --- | --- |
| View transactions, budgets, reports | ✅ All | ✅ All | ✅ All | ✅ All | ❌ | ✅ For its jobs |
| Create transaction | ✅ As Confirmed | ❌ | ✅ As Confirmed | ❌ | ✅ As Unreviewed only | ✅ Recurring, as Unreviewed |
| Edit or confirm transaction | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Trash or restore transaction | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Permanently delete (purge) | ✅ Empty trash | ❌ | ❌ | ❌ | ❌ | ✅ After 30 days in trash |
| Run afford check | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Import a Money Manager TSV, roll back an import | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit accounts, categories, tags, currencies and templates | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit budget items, income rules, payday, holidays, categorisation and recurring rules | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Open and close pay cycles | ❌ Automatic only | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create or revoke API tokens | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pair a phone | ✅ Shows the code | ❌ | ❌ | ❌ | ❌ | ❌ |
| View System page and audit log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export all data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Run a backup | ✅ "Run now" | ❌ | ❌ | ❌ | ❌ | ✅ Nightly |

**Rules**

- **Visibility:** the owner sees every record. The ingest token reads nothing, not even what it created; responses carry ids only.
- **Delegation:** none. Only tokens act on the owner's behalf, and only within their scopes.
- **Where tokens work:** `fiscus:ingest` is accepted only on the public endpoint; `fiscus:read`, `fiscus:write` and `fiscus:settings` only through Tailscale.
- **The phone app** acts through its token, so the token columns cover it. Pairing gives it `fiscus:read`, `fiscus:write` and `fiscus:settings`; a script gets `fiscus:settings` only if you tick it. What only the owner's session may do (imports, tokens, Empty trash, the System page and the export) is done in the web app.
- **Revoked or expired tokens:** requests fail with 401 from that moment. Transactions a token created stay, attributed to the token's name.
- **Owner lockout:** handled by recovery codes and the server reset command (US-02).

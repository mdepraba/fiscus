# Sign-in

How the owner gets into Fiscus, and back in after losing a device.

These are platform screens from `libs/ui`, under `/sign-in` (FR-14).

Sign-in opens the start view, Daily by default (FD-07). The Security and Sessions settings, where passkeys, the authenticator app and recovery codes are managed later, belong to another doc.

Fiscus answers only on the tailnet hostname. Any request from outside the tailnet, except the ingest path, gets 404, so these screens are never reachable from the internet (FR-01, AC-01.3).

## UI-CORE-01 Sign in

Sign in with a passkey, or with a password plus a 6-digit code from an authenticator app or a recovery code.

- **Route:** `/sign-in?next=…`
- **Reached from:** any page without a valid session, Sign out, an expired or revoked session
- **Offline:** "You're offline. Signing in needs a connection.", with the buttons disabled
- **Stories:** US-01, US-02, AC-01.1, AC-01.2, AC-02.1, AC-02.2, FR-02, FR-03, BR-29

**Layout**

1. The name, Fiscus.
2. Sign in with passkey, the main button.
3. "Use password instead". It shows Password, a 6-digit Code field, Sign in, and the link "Use a recovery code", which swaps the Code field for a Recovery code field.
4. A line for errors.
5. The link "Can't sign in?"

**States**

| State | What you see | Source |
| --- | --- | --- |
| Default | Sign in with passkey, and "Use password instead" | FR-02 |
| Password form | Password, Code, Sign in, and "Use a recovery code" | FR-02 |
| Recovery form | Password, Recovery code, Sign in, and "Use authenticator code" | AC-02.1 |
| Locked | "Too many attempts, try again at HH:MM", with the time filled in. Every field and button is disabled until then | BR-29, AC-01.2 |
| Session ended | "Your session ended. Sign in again." above the buttons | Proposed |
| Offline | The offline line, with the buttons disabled | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Sign in with passkey | Click | Opens the browser's passkey prompt. Success starts a session that lasts 30 days on this device, writes an audit entry, and opens the `next` address or the start view | AC-01.1, FR-02, FR-03, FR-13, FD-07 |
| 2 | Passkey prompt | Cancel it | Nothing changes, and the attempt does not count toward the lockout | FD-06 |
| 3 | Passkey prompt | The passkey is not accepted | "That passkey didn't work. Try again or use your password." The attempt counts toward the lockout, and an audit entry is written | BR-29, FR-13, FD-06 |
| 4 | Use password instead | Click | Shows the password form and focuses Password | FR-02 |
| 5 | Password › Show | Click | Shows or hides the password | Proposed |
| 6 | Code | Type | Takes 6 digits, with a numeric keypad on a phone | FR-02 |
| 7 | Sign in | Click, or Enter | Right password and code: as in row 1. Otherwise: "Password or code is wrong", which counts toward the lockout and writes an audit entry | FR-02, FD-06, FR-13 |
| 8 | Sign in | The fifth failure within 15 minutes | "Too many attempts, try again at HH:MM". Sign-in is locked for 15 minutes, the owner gets an email at once with the time and the tailnet device's name, and the attempts are in the audit log | BR-29, AC-01.2, 5.2, BG-11 |
| 9 | Any button while locked | Click | Refused with the same message until HH:MM | BR-29 |
| 10 | Use a recovery code | Click | Swaps the Code field for Recovery code | AC-02.1 |
| 11 | Sign in, with a recovery code | Click | Right password and an unused code: the code is burned, a session starts, and UI-CORE-03 opens | AC-02.1, FR-04 |
| 12 | Sign in, with a recovery code | The code was used before | Refused with "This code was already used". This counts toward the lockout | AC-02.2, BR-29 |
| 13 | Use authenticator code | Click | Swaps back to the Code field | Proposed |
| 14 | Can't sign in? | Click | Shows: "Use a recovery code. If none are left, run the reset command on the server over SSH. It prints a sign-in link." | EC-20, FR-05, Proposed |

**Leads to:** the start view (UI-FIS-01 by default), UI-CORE-03.

## UI-CORE-02 Sign-in link and setup

The one-time link printed by the server's reset command. It opens a short setup: a password, a second factor, and recovery codes. It is how the owner gets in on a fresh install, and after the reset command has cleared everything.

- **Route:** `/sign-in/link`, with the one-time code in the link
- **Reached from:** the link printed by the reset command (BG-13)
- **Offline:** needs a connection
- **Stories:** US-02, AC-02.3, FR-04, FR-05, EC-20, FD-05

**Opening the link**

| Case | What happens next | Source |
| --- | --- | --- |
| Valid: unused and within 15 minutes | The code is exchanged for a setup session that can only finish this wizard, and step 1 opens | FR-05, FD-05 |
| Expired or used | "This sign-in link has expired or was already used. Run the reset command on the server again." There is no form | FR-05, Proposed |

**Steps**

1. **Password.** "Set a password", with a Confirm field. It is required on a fresh install. After a reset, "Keep my current password" is offered too (FD-05).
2. **Second factor.** Add a passkey, or set up an authenticator app, or both. At least one is needed before Continue (FD-06).
3. **Recovery codes.** The 10 codes, shown once, with Copy all and Download as .txt. Finish is enabled once "I've saved these codes" is ticked (FR-04).

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Password, Confirm | Type | Under 12 characters shows "Use at least 12 characters". A Confirm that differs shows "Passwords don't match" | Proposed |
| 2 | Keep my current password (after a reset only) | Click | Skips to step 2 | FD-05 |
| 3 | Continue (step 1) | Click | Stores the new password, hashed with argon2id, and opens step 2 | FR-02 |
| 4 | Add a passkey | Click | Opens the browser's passkey registration. A Name field follows, filled with the device's name, then Save. The passkey shows as added | FR-02 |
| 5 | Set up an authenticator app | Click | Shows a QR code and the key as text, then a Code field. The right code sets the app up. A wrong one shows "That code didn't match. Try the newest code." | FR-02 |
| 6 | Continue (step 2) | Click | Enabled once a passkey or an authenticator app is set up. Opens step 3 | FD-06 |
| 7 | Copy all | Click | Copies the 10 codes, and the button reads "Copied" | Proposed |
| 8 | Download as .txt | Click | Downloads the codes as a text file | Proposed |
| 9 | I've saved these codes | Tick | Enables Finish | FR-04 |
| 10 | Finish | Click | The codes are stored as hashes. A normal 30-day session starts, audit entries are written, and the start view opens: on a fresh install, Daily's first-run state (J-01) | FR-03, FR-04, FR-13, NFR-10 |
| 11 | Leaving before Finish | Close the tab | The link is spent. Run the reset command again to start over | FD-05 |

**Leads to:** the start view (UI-FIS-01).

## UI-CORE-03 Secure your account

After a recovery-code sign-in, it asks for a new passkey or authenticator app, so the owner is not locked out again.

- **Route:** `/sign-in/secure`
- **Reached from:** a recovery-code sign-in on UI-CORE-01; Set up on the "New second factor" banner
- **Offline:** needs a connection
- **Stories:** AC-02.1, FR-04

**Layout**

1. "You signed in with a recovery code. Register a new passkey or authenticator app so you aren't locked out again."
2. "6 recovery codes left."
3. Add a passkey, Set up an authenticator app, and Later.

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Add a passkey | Click | Registers a passkey, as in UI-CORE-02 row 4. The toast reads "Passkey added", an audit entry is written, and the start view opens | AC-02.1, FR-13 |
| 2 | Set up an authenticator app | Click | Sets one up, as in UI-CORE-02 row 5. It replaces the app on the lost device. The toast reads "Authenticator app set up", and the start view opens | AC-02.1, Proposed |
| 3 | Later | Click | Opens the start view. The "New second factor" banner stays until a passkey or app is added | Proposed |
| 4 | Create new recovery codes (shown with 3 or fewer left) | Click | Opens the Security settings, outside this doc | FR-04, Proposed |

The lost device's passkey is removed in the Security settings, outside this doc.

**Leads to:** the start view (UI-FIS-01).

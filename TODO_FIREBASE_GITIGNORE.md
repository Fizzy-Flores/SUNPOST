# Firebase sensitive data: gitignore plan

## Added to `.gitignore`
- Ignore Firebase-related credential files and directories:
  - `WEBSITE/Sunpost/backend/.env`
  - `WEBSITE/CREDENTIALS/`
  - `WEBSITE/Sunpost/backend/credentials/`
- Ignore Firebase/Emulator debug logs:
  - `firebase-debug.log`
  - `firebase-debug.*.log`
- Ignore Firebase project config files that may contain sensitive settings:
  - `.firebaserc`
  - `firebase.json`
  - `firestore.indexes.json`
  - `firestore.rules`

## Important
- This prevents accidental commits of Firebase credentials and environment configuration.


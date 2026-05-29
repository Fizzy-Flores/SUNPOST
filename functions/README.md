# Sunpost Firebase Functions

This folder contains Firebase Authentication triggers for user creation and deletion.

## Triggers

- `sendWelcomeEmail`: runs when a Firebase Auth user is created.
- `sendByeEmail`: runs when a Firebase Auth user is deleted.

Both triggers read the Auth user attributes:

```js
const email = user.email;
const displayName = user.displayName;
```

## Gmail Setup

Before deploying, configure the Gmail address and secret password:

```bash
firebase functions:config:set gmail.user="your-email@gmail.com"
firebase functions:secrets:set gmailPassword
```

Then deploy:

```bash
firebase deploy --only functions
```

If Gmail credentials are missing, the functions log an email preview instead of sending.

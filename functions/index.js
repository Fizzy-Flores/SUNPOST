const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const firebaseServiceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const firebaseDatabaseURL = process.env.FIREBASE_DATABASE_URL;

if (firebaseServiceAccountKey) {
  try {
    const serviceAccount = JSON.parse(firebaseServiceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseDatabaseURL,
    });
  } catch (error) {
    console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  }
} else if (!admin.apps.length) {
  admin.initializeApp();
}

const GMAIL_PASSWORD_SECRET = 'gmailPassword';

function getMailTransport() {
  const gmailUser = process.env.GMAIL_USER || functions.config().gmail?.user;
  const password = process.env.GMAIL_PASSWORD || process.env.gmailPassword || functions.config().gmail?.password;

  if (!gmailUser || !password) {
    functions.logger.warn('Gmail credentials are not configured. Email will be logged instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: password,
    },
  });
}

async function sendAuthEmail({ to, subject, text }) {
  if (!to) {
    functions.logger.info('Skipping auth email because the Firebase user has no email address.');
    return;
  }

  const transport = getMailTransport();
  const from = process.env.GMAIL_USER || functions.config().gmail?.user;
  if (!transport) {
    functions.logger.info('Auth email preview', { from, to, subject, text });
    return;
  }

  if (!from) {
    functions.logger.error('Gmail sender address is not configured. Email cannot be sent.');
    return;
  }

  await transport.sendMail({ from, to, subject, text });
}

exports.sendWelcomeEmail = functions
  .runWith({ secrets: [GMAIL_PASSWORD_SECRET] })
  .auth.user()
  .onCreate(async (user) => {
    const email = user.email;
    const displayName = user.displayName;
    const name = displayName || 'Sunpost creator';

    functions.logger.info('New Firebase user created', {
      uid: user.uid,
      email,
      displayName,
    });

    await sendAuthEmail({
      to: email,
      subject: 'Welcome to Sunpost',
      text: `Hi ${name}, welcome to Sunpost! Your account is ready.`,
    });
  });

exports.sendByeEmail = functions
  .runWith({ secrets: [GMAIL_PASSWORD_SECRET] })
  .auth.user()
  .onDelete(async (user) => {
    const email = user.email;
    const displayName = user.displayName;
    const name = displayName || 'Sunpost creator';

    functions.logger.info('Firebase user deleted', {
      uid: user.uid,
      email,
      displayName,
    });

    await sendAuthEmail({
      to: email,
      subject: 'Your Sunpost account was deleted',
      text: `Hi ${name}, your Sunpost account has been deleted. We're sorry to see you go.`,
    });
  });

// Expose HTTP API via a single function to mirror the Vercel API
const httpApi = require('./httpApi');

exports.api = functions.https.onRequest(async (req, res) => {
  // Ensure admin is initialized
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp();
  }

  try {
    await httpApi(req, res);
  } catch (e) {
    functions.logger.error('HTTP API error', e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

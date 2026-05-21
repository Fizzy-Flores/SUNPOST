import type { FormEvent } from 'react';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { auth, db, googleProvider, firebaseReady } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

interface SignUpPageProps {
  onClose: () => void;
}

export function SignUpPage({ onClose }: SignUpPageProps) {
  const { authenticate } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createUserProfile = async (uid: string, email: string, chosenUsername: string) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      username: chosenUsername,
      email,
      createdAt: serverTimestamp(),
      provider: 'password',
    }, { merge: true });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!firebaseReady || !auth || !db) {
      setError('Firebase is not configured. Please add your Firebase config to .env.');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept terms and services to continue.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, email, username);
      authenticate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    if (!firebaseReady || !auth || !db) {
      setError('Firebase is not configured. Please add your Firebase config to .env.');
      setLoading(false);
      return;
    }

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: user.displayName || user.email || 'Google user',
        email: user.email,
        provider: 'google',
        createdAt: serverTimestamp(),
      }, { merge: true });
      authenticate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090309] text-white figma-page-surface">
      <div className="absolute inset-0 bg-[#10070e]/90 backdrop-blur-sm" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12">
        <div className="w-full figma-card p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
            <div className="figma-panel p-10 lg:p-12">
              <p className="text-xs uppercase tracking-[0.35em] text-[#f6e9c8]/75">Night time access</p>
              <h1 className="mt-6 text-6xl font-serif uppercase tracking-[0.24em] text-white figma-heading">AUTHENTICATION</h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-[#f4e5d4]/80">
                Step into the Night Market with a secure account. Your access is reviewed before entry, so make sure the details are correct.
              </p>
              <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                <p className="text-sm uppercase tracking-[0.28em] text-white/75">Why register?</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white">
                  <li>• Secure authentication backed by Firebase</li>
                  <li>• Personal artwork and commission dashboard</li>
                  <li>• Exclusive Night Market content for approved members</li>
                </ul>
              </div>
            </div>

            <div className="figma-panel p-10 lg:p-12">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.35em] text-[#f6e9c8]/70">Create account</p>
                <h2 className="mt-4 text-4xl font-serif text-white">Join the Night Market</h2>
              </div>

              {!firebaseReady && (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/15 p-4 text-sm text-white">
                  Firebase is not configured. Fill in your Firebase config values in `.env` and restart the Vite server to enable signup.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="figma-field min-h-[3.5rem] rounded-[1.5rem] px-5 text-white placeholder:text-white/60 outline-none focus:border-[#f7e1b6]/70"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="figma-field min-h-[3.5rem] rounded-[1.5rem] px-5 text-white placeholder:text-white/60 outline-none focus:border-[#f7e1b6]/70"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="figma-field min-h-[3.5rem] rounded-[1.5rem] px-5 text-white placeholder:text-white/60 outline-none focus:border-[#f7e1b6]/70"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="figma-field min-h-[3.5rem] rounded-[1.5rem] px-5 text-white placeholder:text-white/60 outline-none focus:border-[#f7e1b6]/70"
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="h-5 w-5 rounded border-white/20 bg-white/5 accent-white"
                  />
                  <span>I accept terms and services</span>
                </label>

                {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="figma-primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="figma-secondary-button mt-1 flex w-full items-center justify-center gap-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="h-5 w-5" />
                  Continue with Google
                </button>
              </form>

              <button
                onClick={onClose}
                className="figma-secondary-button mt-8 w-full bg-transparent text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

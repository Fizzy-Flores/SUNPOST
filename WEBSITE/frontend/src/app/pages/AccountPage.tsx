import { FormEvent, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db, firebaseReady } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const LOCAL_STORAGE_ACCOUNT_KEY = 'sunpost-account';

export function AccountPage() {
  const { theme } = useTheme();
  const isDark = theme === 'night';
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadLocalAccount = () => {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_ACCOUNT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { username?: string; email?: string; bio?: string };
          setUsername(parsed.username ?? '');
          setEmail(parsed.email ?? '');
          setBio(parsed.bio ?? '');
        } catch {
          // ignore invalid local storage
        }
      }
      setLoading(false);
    };

    if (!firebaseReady || !auth || !db) {
      loadLocalAccount();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !db) {
        loadLocalAccount();
        setUserId(null);
        return;
      }

      setUserId(user.uid);
      setEmail(user.email || '');

      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setUsername((data.username as string) ?? user.displayName ?? '');
          setBio((data.bio as string) ?? '');
          if (data.email) {
            setEmail(data.email as string);
          }
        } else {
          setUsername(user.displayName ?? '');
          setBio('');
        }
      } catch {
        setStatusMessage('Unable to load account data.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveAccount = async () => {
    setStatusMessage(null);
    setSaving(true);

    if (!firebaseReady || !auth || !db || !userId) {
      const localValue = { username, email, bio };
      window.localStorage.setItem(LOCAL_STORAGE_ACCOUNT_KEY, JSON.stringify(localValue));
      setStatusMessage('Saved locally. Firebase is not configured or you are not signed in.');
      setSaving(false);
      return;
    }

    try {
      await setDoc(doc(db, 'users', userId), {
        username,
        email,
        bio,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setStatusMessage('Account saved successfully.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveAccount();
  };

  return (
    <div className={`min-h-screen px-6 py-12 figma-page-surface ${isDark ? 'text-white' : 'text-white'}`}>
      <div className="container mx-auto max-w-4xl">
        <div className="figma-card rounded-[2rem] p-8">
          <div className="flex items-center gap-8 mb-8">
            <div className={`w-32 h-32 rounded-full overflow-hidden ${isDark ? 'bg-[#E8D5B5]' : 'bg-white'}`}>
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Avatar
              </div>
            </div>
            <div>
              <h2 className={`text-3xl font-serif mb-2 ${isDark ? 'text-[#E8D5B5]' : 'text-black'}`}>
                Your Account
              </h2>
              <p className={`${isDark ? 'text-[#E8D5B5]/80' : 'text-black/80'}`}>
                Manage your profile and settings
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-white/70">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="figma-field w-full px-4 py-3 rounded-[1.5rem]"
              />
            </div>

            <div>
              <label className="block mb-2 text-white/70">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="figma-field w-full px-4 py-3 rounded-[1.5rem]"
              />
            </div>

            <div>
              <label className="block mb-2 text-white/70">
                Bio
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="figma-field w-full px-4 py-3 rounded-[1.5rem]"
              />
            </div>

            {statusMessage && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

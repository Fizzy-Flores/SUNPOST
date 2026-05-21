import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArtworkCard } from '../components/ArtworkCard';
import { Moon } from 'lucide-react';
import { Button } from '../components/ui/button';

export function HomePage() {
  const navigate = useNavigate();
  const { theme, isAuthenticated } = useTheme();
  const isDark = theme === 'night';

  const artworks = Array(8).fill(null);

  return (
    <div className={`min-h-screen px-6 py-12 figma-page-surface ${isDark ? 'text-white' : 'text-white'}`}>
      <div className="absolute inset-0 bg-[#090309]/90" />
      <div className="relative z-10 container mx-auto max-w-7xl">
        {!isAuthenticated && !isDark && (
          <div className="mb-8 figma-card overflow-hidden bg-black/70 p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/35 via-transparent to-[#000000]/45" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-serif uppercase tracking-[0.2em] text-white">The Night Market</h2>
                <p className="mt-4 text-base leading-7 text-white/75">
                  Exclusive access to commissions, artwork drops, and private creative events for approved members.
                </p>
              </div>
              <Button
                onClick={() => navigate('/signup')}
                variant="default"
                size="lg"
                className="figma-primary-button text-black"
              >
                Join the Night Market
              </Button>
            </div>
          </div>
        )}

        {isDark && (
          <div className="mb-8 bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-6 text-white border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-6 h-6" />
                <div>
                  <p className="font-semibold">You're in the Night Market</p>
                  <p className="text-sm text-white/80">Viewing NSFW content · 18+</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className={isDark ? 'section-dark' : 'section-light'}>
          <h2 className="section-title">ARTIST OF THE WEEK</h2>
          <div className="flex items-center gap-6">
            <div className={`w-48 h-48 rounded-full overflow-hidden ${isDark ? 'bg-[#E8D5B5]' : 'bg-white'}`}>
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Artist Photo
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif mb-2">Featured Artist Name</h3>
              <p className="text-sm opacity-80">
                Vulture · 7 day ago <br />
                Face in and out background
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className={`section-title ${isDark ? 'text-[#E8D5B5]' : 'text-black'}`}>
            HONORABLE MENTIONS
          </h2>
          <div className="artwork-grid">
            {artworks.map((_, index) => (
              <ArtworkCard key={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

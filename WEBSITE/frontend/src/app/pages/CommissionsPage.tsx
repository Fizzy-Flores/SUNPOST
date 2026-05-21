import { useTheme } from '../context/ThemeContext';
import { CategoryButton } from '../components/CategoryButton';
import { ArtworkCard } from '../components/ArtworkCard';

export function CommissionsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'night';

  const categories = [
    'Illustrations',
    '3D Makers',
    'Writings',
    'Music',
    'Designers',
    '2D Avatars',
    'Animation',
    'Voice Acting',
  ];

  const actionCategories = ['Licenses', 'Service Options', 'On Sale'];

  const artworks = Array(4).fill(null);

  return (
    <div className={`min-h-screen px-6 py-12 figma-page-surface ${isDark ? 'text-white' : 'text-white'}`}>
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10">
          <p className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-[#E8D5B5]/80' : 'text-black/70'}`}>
            Commissions
          </p>
          <h1 className={`mt-3 text-4xl font-serif tracking-tight ${isDark ? 'text-[#E8D5B5]' : 'text-black'}`}>
            Request custom commissions from top creators.
          </h1>
          <p className={`mt-4 max-w-2xl ${isDark ? 'text-[#E8D5B5]/75' : 'text-black/75'}`}>
            Explore commission categories, adjust service preferences, and find the perfect creative partner.
          </p>
        </div>

        <section className="mb-10 figma-panel p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-[#E8D5B5]' : 'text-black'}`}>Commission categories</h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-[#E8D5B5]/75' : 'text-black/70'}`}>
                Choose the type of creative work you need and refine your request.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryButton key={category} label={category} />
            ))}
          </div>
        </section>

        <section className="mb-12 figma-panel p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-black">Service filters</h2>
              <p className="mt-2 text-sm text-black/70">Quickly surface license, service, and on-sale commission options.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actionCategories.map((category) => (
              <CategoryButton key={category} label={category} variant="action" />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-[#E8D5B5]' : 'text-black'}`}>Featured commission slots</h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-[#E8D5B5]/75' : 'text-black/70'}`}>
                Preview available artists and commission opportunities.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {artworks.map((_, index) => (
              <ArtworkCard key={index} title={`Commission slot ${index + 1}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

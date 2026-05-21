import { CategoryButton } from '../components/CategoryButton';

export function ShopPage() {
  const categories = [
    'Character Designs',
    '3D Makers',
    'Educational',
    'Music',
    'Graphics + Assets',
    '2D Avatars',
    'Branding and Video',
    'Video Editing',
  ];

  const actionCategories = ['Licenses', 'Service Options', 'On Sale'];

  return (
    <div className="min-h-screen bg-[#D4AF6A] px-6 py-10 text-[#3D1E0E]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-6 rounded-[2rem] bg-[#C89A51] p-6 shadow-[0_35px_80px_-45px_rgba(0,0,0,0.35)] border border-[#B88446]/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[#7E3210] text-[#F2E3B8] text-xl font-semibold shadow-inner shadow-black/20">
              ✦
            </div>
            <div className="hidden text-sm uppercase tracking-[0.35em] text-[#F2E3B8]/90 sm:block">COMMISSIONS</div>
          </div>

          <div className="flex flex-1 items-center justify-center text-center text-2xl font-serif uppercase tracking-[0.28em] text-[#7E2E0C]">
            <span>COMMISSIONS</span>
            <span className="mx-4">SHOP</span>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="h-12 min-w-[22rem] rounded-full bg-white px-4 text-sm text-[#3D1E0E] shadow-[0_10px_30px_-25px_rgba(0,0,0,0.5)] flex items-center">
              Search...
            </div>
            <div className="h-12 w-12 rounded-full bg-[#7E3210] shadow-inner shadow-black/35" />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryButton key={category} label={category} variant="shop" />
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {actionCategories.map((category) => (
            <CategoryButton
              key={category}
              label={category}
              variant="action"
            />
          ))}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 rounded-[2rem] bg-[#7E3210] shadow-[0_25px_60px_-30px_rgba(0,0,0,0.6)]"
            />
          ))}
        </section>
      </div>
    </div>
  );
}

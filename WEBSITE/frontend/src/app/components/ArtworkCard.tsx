import { useTheme } from '../context/ThemeContext';

interface ArtworkCardProps {
  imageUrl?: string;
  title?: string;
}

export function ArtworkCard({ imageUrl, title }: ArtworkCardProps) {
  return (
    <div className="artwork-card overflow-hidden bg-gradient-to-br from-[#5E2A0F] via-[#823F11] to-[#B88750]">
      {imageUrl ? (
        <img src={imageUrl} alt={title || 'Artwork'} />
      ) : (
        <div className="h-full w-full flex flex-col justify-end p-6 text-white bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.12),transparent_60%)]">
          <span className="text-xs uppercase tracking-[0.24em] text-white/70">Featured</span>
          <h3 className="mt-3 text-lg font-semibold">{title ?? 'Artwork Preview'}</h3>
          <p className="mt-2 text-sm text-white/80">Tap to explore more details.</p>
        </div>
      )}
    </div>
  );
}

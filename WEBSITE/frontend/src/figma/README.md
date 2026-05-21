# Figma Design Integration

This directory contains all Figma design integration utilities and components.

## Structure

- **`ImageWithFallback.tsx`** - Reusable component for displaying Figma design exports with error handling
- **`index.ts`** - Main export file with design assets and utilities
- **`types.ts`** - TypeScript types for Figma components and design tokens

## Design Assets

Design exports from Figma are stored in `src/imports/` as PNG files:

- **Screenshots**: `Screenshot__12_.png` through `Screenshot__18_.png`
- **Images**: `image.png`, `image-1.png`, `image-2.png`

## Usage

### Using ImageWithFallback Component

```tsx
import { ImageWithFallback } from '@/figma';

export function MyComponent() {
  return (
    <ImageWithFallback
      src="/path/to/figma-export.png"
      alt="Design component"
      className="w-full h-auto"
    />
  );
}
```

### Using Design Assets

```tsx
import { FigmaDesignAssets } from '@/figma';

export function GalleryComponent() {
  const { screenshots } = FigmaDesignAssets;
  
  return (
    <img src={screenshots.screenshot12} alt="Design export" />
  );
}
```

### Using Figma Asset Resolver

For assets placed in `src/assets/`:

```tsx
import myAsset from 'figma:asset/my-file.png';
```

## Asset Resolver Configuration

The Vite plugin `figmaAssetResolver` in `vite.config.ts` handles resolving `figma:asset/` imports. Assets should be placed in the `src/assets/` directory.

## Best Practices

1. **Image Optimization**: Keep design exports optimized for web (PNG or WebP)
2. **Accessibility**: Always provide meaningful `alt` text for images
3. **Error Handling**: Use `ImageWithFallback` to gracefully handle missing or broken images
4. **Responsive Design**: Use Tailwind CSS classes with responsive prefixes
5. **Theme Integration**: Coordinate design exports with the theme system in `src/app/context/ThemeContext.tsx`

## Adding New Design Assets

1. Export from Figma as PNG (or other supported format)
2. Place in `src/imports/` (for screenshots/reference images)
3. Reference in `src/figma/index.ts` export
4. Use in components via the `FigmaDesignAssets` export

## Integration with Components

All page components in `src/app/pages/` and UI components in `src/app/components/ui/` are set up to use the Figma design exports. Import the `ImageWithFallback` component and design assets as needed.

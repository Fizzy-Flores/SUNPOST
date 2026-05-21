<!-- 
  FIGMA INTEGRATION QUICK REFERENCE
  Copy this into your bookmark or keep in a dev reference
-->

# Figma Integration Quick Reference 🎨

## Import from `@/figma`

```tsx
// Image component with error handling
import { ImageWithFallback } from '@/figma';

// All design assets from Figma exports
import { FigmaDesignAssets } from '@/figma';

// TypeScript types
import type { FigmaImageProps, FigmaDesignExport } from '@/figma';

// Example gallery component
import DesignGallery from '@/figma/examples/DesignGallery';
```

## Using Design Assets

```tsx
// Access by category
const { screenshots, images } = FigmaDesignAssets;

// Use specific screenshot
<img src={screenshots.screenshot12} alt="Design 12" />

// Use in ImageWithFallback
<ImageWithFallback 
  src={screenshots.screenshot15} 
  alt="My design"
  className="w-full"
/>

// Get screenshot by number
const design = FigmaDesignAssets.getScreenshot(14);

// List all available
const available = FigmaDesignAssets.list();

// Get all at once
const all = FigmaDesignAssets.getAll();
```

## Available Design Assets

| Type | Assets |
|------|--------|
| Screenshots | screenshot12-18 (7 designs) |
| Images | image, image1, image2 |

## ImageWithFallback Component

```tsx
<ImageWithFallback
  src={imagePath}           // Required: image source
  alt="Description"         // Required: alt text
  className="w-full"        // Optional: Tailwind classes
  style={{ height: '300px' }}  // Optional: inline styles
  onLoad={() => {}}         // Optional: load callback
  onError={() => {}}        // Optional: error callback
/>
```

Features:
- ✅ Graceful error handling
- ✅ Placeholder SVG on failure
- ✅ Stores original URL in `data-original-url`
- ✅ Passes through all img attributes

## Asset Resolver (Advanced)

For assets in `src/assets/`:

```tsx
import myFile from 'figma:asset/my-file.png';
```

## Common Patterns

### 1. Gallery Display
```tsx
import DesignGallery from '@/figma/examples/DesignGallery';

export function ShowDesigns() {
  return <DesignGallery title="Design System" columns={2} />;
}
```

### 2. Hero Image
```tsx
import { ImageWithFallback, FigmaDesignAssets } from '@/figma';

export function Hero() {
  return (
    <section className="w-full">
      <ImageWithFallback
        src={FigmaDesignAssets.screenshots.screenshot12}
        alt="Hero section"
        className="w-full h-96 object-cover"
      />
    </section>
  );
}
```

### 3. Responsive Layout
```tsx
const { screenshots } = FigmaDesignAssets;

return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Object.values(screenshots).map((src, i) => (
      <ImageWithFallback
        key={i}
        src={src}
        alt={`Design ${i}`}
        className="w-full aspect-video object-cover rounded"
      />
    ))}
  </div>
);
```

### 4. Conditional Display
```tsx
const { screenshots } = FigmaDesignAssets;
const isAuthenticated = useAuth().isAuthenticated;

return isAuthenticated ? (
  <ImageWithFallback src={screenshots.screenshot18} alt="Premium" />
) : (
  <ImageWithFallback src={screenshots.screenshot12} alt="Public" />
);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Image not loading | Check path in `src/imports/` |
| Import error | Ensure using `@/figma` not relative paths |
| Type errors | Import types from `@/figma` |
| Asset resolver not working | Verify file in `src/assets/` exists |

## Add New Design

1. Export from Figma as PNG
2. Place in `src/imports/` or `src/assets/`
3. Add import to `src/figma/index.ts`
4. Export in `FigmaDesignAssets` or use `figma:asset/` resolver

## Documentation Files

- 📖 `src/figma/README.md` - Full documentation
- 🚀 `FIGMA_INTEGRATION_SETUP.md` - Setup details
- 💡 `src/figma/types.ts` - Type definitions
- 📝 `src/figma/examples/DesignGallery.tsx` - Example code

## Next Steps

- [ ] Update page components to use FigmaDesignAssets
- [ ] Implement responsive image galleries
- [ ] Add design tokens to theme system
- [ ] Export additional designs from Figma
- [ ] Create reusable design-based components

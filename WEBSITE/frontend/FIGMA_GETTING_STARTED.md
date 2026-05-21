<!-- GETTING STARTED WITH FIGMA INTEGRATION -->

# 🚀 Getting Started - Figma Design Integration

> **TL;DR**: Your Figma designs are in `src/imports/` and ready to use via `import { FigmaDesignAssets } from '@/figma'`

## 5-Minute Quick Start

### 1. Import the Assets
```tsx
import { FigmaDesignAssets, ImageWithFallback } from '@/figma';
```

### 2. Use in Your Component
```tsx
export function MyComponent() {
  return (
    <ImageWithFallback
      src={FigmaDesignAssets.screenshots.screenshot12}
      alt="My design"
      className="w-full rounded-lg"
    />
  );
}
```

### 3. That's It! 🎉

## Available Designs

You have **10 design exports** ready to use:

```
Screenshots (use for layouts/wireframes):
- screenshot12 through screenshot18 (7 images)

Images (supporting graphics):
- image, image1, image2 (3 images)
```

## Common Uses

### Display Single Design
```tsx
<ImageWithFallback 
  src={FigmaDesignAssets.screenshots.screenshot12}
  alt="Homepage design"
  className="w-full"
/>
```

### Display Gallery
```tsx
import DesignGallery from '@/figma/examples/DesignGallery';

// Shows all 10 designs in a grid
<DesignGallery columns={3} />
```

### Use in Loop
```tsx
{Object.values(FigmaDesignAssets.screenshots).map((src, i) => (
  <img key={i} src={src} alt={`Design ${i}`} />
))}
```

## Why Use ImageWithFallback?

```tsx
// ✅ Good - has error handling
<ImageWithFallback src={design} alt="Design" />

// ❌ Less ideal - no error handling
<img src={design} alt="Design" />
```

## File Locations

```
📦 Frontend Structure
├── 📁 src/
│   ├── 📁 figma/             ← Figma module (your new stuff!)
│   │   ├── index.ts          ← Exports FigmaDesignAssets
│   │   └── examples/
│   │       └── DesignGallery.tsx ← Example component
│   ├── 📁 imports/           ← Your design files here
│   │   ├── Screenshot__12_.png
│   │   ├── Screenshot__13_.png
│   │   ├── ...
│   │   └── image.png
│   └── 📁 app/
│       ├── pages/
│       ├── components/
│       └── App.tsx
└── 📄 vite.config.ts         ← Updated ✓
```

## Import Patterns

```tsx
// ✅ Recommended - clean import
import { FigmaDesignAssets } from '@/figma';

// ✅ Also works - with component
import { ImageWithFallback, FigmaDesignAssets } from '@/figma';

// ✅ Advanced - with types
import { FigmaDesignAssets, ImageWithFallback, type FigmaImageProps } from '@/figma';

// ❌ Avoid - relative paths
import { FigmaDesignAssets } from '../../../figma';
```

## API Examples

```tsx
// Get specific screenshot
const design = FigmaDesignAssets.screenshots.screenshot12;
const design = FigmaDesignAssets.getScreenshot(12); // same thing

// Get all screenshots
const all = FigmaDesignAssets.screenshots;

// Get specific image
const img = FigmaDesignAssets.images.image1;

// List available
const list = FigmaDesignAssets.list();
// { screenshots: ['screenshot12', ...], images: [...] }

// Get everything
const everything = FigmaDesignAssets.getAll();
```

## Component Props

```tsx
<ImageWithFallback
  src={FigmaDesignAssets.screenshots.screenshot12}  // Required
  alt="Description of the image"                     // Required
  className="w-full rounded-lg"                      // Optional
  style={{ maxHeight: '500px' }}                     // Optional
  onLoad={() => console.log('loaded')}              // Optional
  onError={() => console.log('failed')}             // Optional
/>
```

## Real World Examples

### Example 1: Hero Section
```tsx
import { ImageWithFallback, FigmaDesignAssets } from '@/figma';

export function HeroSection() {
  return (
    <section className="w-full">
      <ImageWithFallback
        src={FigmaDesignAssets.screenshots.screenshot12}
        alt="Hero banner"
        className="w-full h-96 object-cover"
      />
    </section>
  );
}
```

### Example 2: Product Grid
```tsx
export function ProductShowcase() {
  const { screenshots } = FigmaDesignAssets;
  const designs = [12, 13, 14, 15];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {designs.map(num => (
        <ImageWithFallback
          key={num}
          src={FigmaDesignAssets.getScreenshot(num)}
          alt={`Product design ${num}`}
          className="w-full rounded-lg"
        />
      ))}
    </div>
  );
}
```

### Example 3: Responsive Layout
```tsx
export function DesignShowcase() {
  return (
    <div className="w-full flex flex-col gap-8">
      <ImageWithFallback
        src={FigmaDesignAssets.screenshots.screenshot12}
        alt="Mobile view"
        className="md:hidden w-full"
      />
      <ImageWithFallback
        src={FigmaDesignAssets.screenshots.screenshot14}
        alt="Desktop view"
        className="hidden md:block w-full"
      />
    </div>
  );
}
```

## Integration Checklist

- [ ] I can import from `@/figma`
- [ ] I can see the design assets in `FigmaDesignAssets`
- [ ] I tried using `ImageWithFallback` component
- [ ] I tested with at least one screenshot
- [ ] I checked `src/figma/examples/DesignGallery.tsx` for reference
- [ ] I'm ready to use designs in my pages

## Need Help?

1. **Quick answers** → Read `FIGMA_QUICK_REFERENCE.md`
2. **How it works** → Read `FIGMA_INTEGRATION_SETUP.md`
3. **Example code** → Check `src/figma/examples/DesignGallery.tsx`
4. **Module details** → Read `src/figma/README.md`
5. **Types & API** → Check `src/figma/index.ts`

## What's Next?

1. ✅ Use `FigmaDesignAssets` in your page components
2. ✅ Build responsive layouts with the designs
3. ✅ Add more Figma exports as needed
4. ✅ Coordinate with your theme system

## Pro Tips 💡

- Always provide `alt` text for accessibility
- Use `className="w-full"` for responsive images
- Use `object-cover` for consistent image sizing
- Test error handling by temporarily breaking image URLs
- Check browser DevTools to see if images load properly

---

**Ready to build with your Figma designs?** Start by importing `FigmaDesignAssets` in any component! 🎨

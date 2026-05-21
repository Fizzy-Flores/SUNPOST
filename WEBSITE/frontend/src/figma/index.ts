// Figma design integration utilities and components

export { ImageWithFallback } from '../app/components/figma/ImageWithFallback';
export type { FigmaImageProps, FigmaDesignExport, FigmaThemeTokens } from './types';

/**
 * Figma asset resolver plugin resolves imports like:
 * import myImage from 'figma:asset/my-image.png'
 *
 * Assets should be placed in src/assets/ directory
 */

// Design tokens and utilities
export const FigmaAssets = {
  resolveAsset: (filename: string) => `figma:asset/${filename}`,
};

/**
 * Import design export images from Figma
 * Images are located in src/imports/
 */
import screenshot12 from '../imports/Screenshot__12_.png';
import screenshot13 from '../imports/Screenshot__13_.png';
import screenshot14 from '../imports/Screenshot__14_.png';
import screenshot15 from '../imports/Screenshot__15_.png';
import screenshot16 from '../imports/Screenshot__16_.png';
import screenshot17 from '../imports/Screenshot__17_.png';
import screenshot18 from '../imports/Screenshot__18_.png';
import image1 from '../imports/image-1.png';
import image2 from '../imports/image-2.png';
import image from '../imports/image.png';

/**
 * Figma Design Assets
 * 
 * Contains all design exports from Figma for use in components.
 * Screenshots are typically wireframes or design mockups.
 * Images are supporting graphics and visual elements.
 */
export const FigmaDesignAssets = {
  screenshots: {
    screenshot12,
    screenshot13,
    screenshot14,
    screenshot15,
    screenshot16,
    screenshot17,
    screenshot18,
  },
  images: {
    image1,
    image2,
    image,
  },
  
  /**
   * Get a specific screenshot by ID
   */
  getScreenshot: (id: number): string => {
    const screenshotsMap: Record<number, string> = {
      12: screenshot12,
      13: screenshot13,
      14: screenshot14,
      15: screenshot15,
      16: screenshot16,
      17: screenshot17,
      18: screenshot18,
    };
    return screenshotsMap[id] || screenshot12;
  },
  
  /**
   * Get all design assets combined
   */
  getAll: () => ({
    screenshots: {
      screenshot12,
      screenshot13,
      screenshot14,
      screenshot15,
      screenshot16,
      screenshot17,
      screenshot18,
    },
    images: {
      image1,
      image2,
      image,
    },
  }),
  
  /**
   * List all available assets
   */
  list: () => ({
    screenshots: [12, 13, 14, 15, 16, 17, 18].map(id => `screenshot${id}`),
    images: ['image', 'image1', 'image2'],
  }),
};

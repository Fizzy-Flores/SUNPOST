/**
 * Figma Design Gallery Example Component
 * 
 * This component demonstrates how to properly use Figma design exports
 * and the ImageWithFallback component.
 */

import React from 'react';
import { ImageWithFallback } from '../app/components/figma/ImageWithFallback';
import { FigmaDesignAssets } from '../figma';

interface DesignGalleryProps {
  title?: string;
  columns?: number;
}

/**
 * Gallery component for displaying Figma design exports
 * 
 * Usage:
 * ```tsx
 * import { DesignGallery } from '@/figma/examples/DesignGallery';
 * 
 * export function MyPage() {
 *   return <DesignGallery title="Design System" columns={2} />;
 * }
 * ```
 */
export function DesignGallery({ 
  title = 'Figma Design Exports', 
  columns = 2 
}: DesignGalleryProps) {
  const { screenshots, images } = FigmaDesignAssets;

  const allAssets = [
    ...Object.entries(screenshots).map(([name, src]) => ({
      name,
      src,
      type: 'screenshot',
    })),
    ...Object.entries(images).map(([name, src]) => ({
      name,
      src,
      type: 'image',
    })),
  ];

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        {title}
      </h1>
      
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(300px, 1fr))`,
        }}
      >
        {allAssets.map((asset) => (
          <div
            key={asset.name}
            className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <ImageWithFallback
                src={asset.src}
                alt={`${asset.type}: ${asset.name}`}
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {asset.name}
                </h3>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {asset.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Figma design export
              </p>
            </div>
          </div>
        ))}
      </div>

      {allAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No design assets found. Add images to src/imports/ and reference them in src/figma/index.ts
          </p>
        </div>
      )}
    </div>
  );
}

export default DesignGallery;

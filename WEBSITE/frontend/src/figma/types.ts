/**
 * Figma Component Integration Types
 */

export interface FigmaImageProps {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export interface FigmaDesignExport {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'component' | 'icon';
  width?: number;
  height?: number;
  description?: string;
}

export interface FigmaThemeTokens {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, any>;
  breakpoints: Record<string, string>;
}

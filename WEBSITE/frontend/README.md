# CSA Finals - Art Marketplace Web Design

A dual-mode art marketplace platform with SFW (day mode) and NSFW (night mode) content sections. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Dual Theme System**: Day mode (SFW) and Night Market mode (NSFW)
- **Authentication Gate**: Night Market requires 18+ age verification and login
- **Multi-page Navigation**: Home, Shop, Commissions, and Account sections
- **Category Filtering**: Organized browsing for different art types
- **Responsive Design**: Mobile and desktop friendly

## Tech Stack

- React 18.3.1
- TypeScript
- Tailwind CSS v4
- Vite
- Lucide React (icons)
- Radix UI components

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (preferred) or npm

### Installation

1. Extract the project files:
```bash
tar -xzf csa-finals-art-marketplace.tar.gz
cd code
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Start the development server:
```bash
pnpm run dev
# or
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Radix UI)
│   │   ├── Header.tsx       # Navigation header
│   │   ├── CategoryButton.tsx
│   │   └── ArtworkCard.tsx
│   ├── context/
│   │   └── ThemeContext.tsx # Authentication & theme management
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CommissionsPage.tsx
│   │   ├── ShopPage.tsx
│   │   ├── AccountPage.tsx
│   │   └── SignUpPage.tsx
│   └── App.tsx              # Main application
├── styles/
│   ├── theme.css            # Tailwind theme configuration
│   └── fonts.css            # Font imports
└── imports/                 # Design assets (images)
```

## Key Components

### Theme System
- **Day Mode**: SFW content accessible to everyone
- **Night Market**: NSFW content requiring authentication
- Toggle via moon/sun icon in header

### Authentication Flow
1. User clicks moon icon to enter Night Market
2. Sign up/Sign in modal appears
3. Age verification (18+) required
4. Upon authentication, automatically enters Night Market mode
5. Logout returns to day mode

### Pages

**Home**
- Artist of the Week showcase
- Honorable Mentions gallery
- Night Market promotional banner (when not authenticated)

**Commissions**
- Category filters: Illustrations, 3D Makers, Writings, Music, Designers, 2D Avatars, Animation, Voice Acting
- Action buttons: Licenses, Service Options, On Sale
- 4-column artwork grid

**Shop**
- Category filters: Character Designs, 3D Models, Educational, Misc, Graphics & Assets, 2D Avatars, Brushing and Video, Video Editing
- Action buttons: Licenses, Service Options, On Sale
- 3-column artwork grid

**Account**
- User profile management
- Avatar, username, email, bio editing

## Color Palette

### Day Mode
- Background: `#D4AF6A` (warm tan)
- Accent: `#C4A05A` (darker tan)
- Cards: `#8B4513` (brown)
- Text: Black

### Night Mode
- Background: Black
- Text: `#E8D5B5` (cream)
- Accent: Purple/Pink gradients
- Cards: `#1a1a1a` (dark gray)

## Building for Production

```bash
pnpm run build
# or
npm run build
```

Build output will be in the `dist/` directory.

## Notes for Developers

- The project uses Tailwind CSS v4, which has a different configuration approach than v3
- Authentication is currently simulated (client-side only). Implement proper backend authentication for production
- Artwork cards currently use placeholders. Connect to your image API/database
- Search functionality in header needs backend integration

## Future Enhancements

- [ ] Backend API integration
- [ ] Real authentication system
- [ ] Payment processing for commissions/shop
- [ ] Artist profile pages
- [ ] Messaging system
- [ ] Rating/review system
- [ ] Advanced search and filtering
- [ ] Image upload functionality

## License

This project was created for CSA Finals.

## Contact

For questions or issues, please contact the development team.

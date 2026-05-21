import { useTheme } from '../context/ThemeContext';

interface CategoryButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'action' | 'shop';
}

export function CategoryButton({ label, onClick, variant = 'default' }: CategoryButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'night';

  const accentStyles = variant === 'action'
    ? 'bg-[#7E3210] text-[#F2E3B8] font-semibold border border-[#7E3210] shadow-lg hover:shadow-xl'
    : variant === 'shop'
      ? 'bg-[#7E3210] text-[#F2E3B8] font-semibold border border-[#7E3210] shadow-lg hover:shadow-xl'
      : isDark
        ? 'bg-black/85 text-[#E8D5B5] border border-[#E8D5B5]/15'
        : 'bg-white/95 text-black border border-black/10';

  const shapeStyles = variant === 'action'
    ? 'rounded-full px-8 py-4'
    : 'rounded-[2rem] px-5 py-6';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${shapeStyles} ${accentStyles}`}
    >
      <span className="block text-base leading-tight font-serif">{label}</span>
    </button>
  );
}

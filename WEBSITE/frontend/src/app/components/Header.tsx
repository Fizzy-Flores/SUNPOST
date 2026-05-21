import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Search, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export function Header() {
  const { theme, isAuthenticated, requestNightMode, setTheme, logout } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'night';

  const handleThemeToggle = () => {
    if (theme === 'night') {
      setTheme('day');
    } else if (!requestNightMode()) {
      navigate('/signup');
    }
  };

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop' },
    { to: '/commissions', label: 'Commissions' },
    { to: '/account', label: 'Account' },
  ];

  return (
    <header className={`w-full transition-colors duration-300 ${isDark ? 'header-dark' : 'header-light'}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-serif ${isDark ? 'header-title-dark' : 'header-title-light'}`}>
            {isDark ? (
              <span className="flex items-center gap-2">
                🌙 THE NIGHT MARKET
              </span>
            ) : (
              'COMMISSIONS · SHOP'
            )}
          </h1>

          <div className="flex items-center gap-4">
            <div className="search-box">
              <Search className="w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
              />
            </div>

            <button
              onClick={handleThemeToggle}
              className={`icon-btn ${isDark ? 'bg-[#E8D5B5]' : 'bg-white'}`}
              title={isDark ? 'Exit Night Market' : 'Enter Night Market (Authentication Required)'}
            >
              {isDark ? <Sun className="w-5 h-5 text-black" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated && (
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            )}

            <button className={`icon-btn ${isDark ? 'bg-[#E8D5B5]' : 'bg-white'}`}>
              <User className={`w-5 h-5 ${isDark ? 'text-black' : 'text-gray-800'}`} />
            </button>
          </div>
        </div>

        <nav className="flex gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full transition-colors duration-200 ${isActive ? (isDark ? 'nav-tab-dark active' : 'nav-tab-light active') : isDark ? 'nav-tab-dark' : 'nav-tab-light'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavItems } from './layout/navItems';
import { ThemeToggle } from './layout/ThemeToggle';
import { UserMenu } from './layout/UserMenu';
import { ButtonLink } from './ui/Button';
import { cn } from '../lib/cn';

export const Navbar = () => {
  const { user } = useAuth();
  const navItems = getNavItems(user);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
        {/* Brand */}
        <Link to="/flights" className="flex items-center gap-2">
          <Plane size={18} className="text-accent" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Airline Reservation</span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'h-9 inline-flex items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-muted text-ink'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {!user ? (
            <div className="hidden md:flex items-center gap-2">
              <ButtonLink to="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Create account
              </ButtonLink>
            </div>
          ) : (
            <div className="hidden md:block">
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

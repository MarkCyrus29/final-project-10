import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, Plane, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Close on Escape and return focus to trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const initials = `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}` || 'U';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="user-menu-panel"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md p-1 text-ink transition-colors hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg text-xs font-medium" aria-hidden="true">
          {initials}
        </span>
        <span className="hidden lg:inline text-sm font-medium">
          {user.firstName}
        </span>
        <ChevronDown size={16} className="text-ink-subtle" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id="user-menu-panel"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-line bg-surface p-1 shadow-md"
        >
          {/* Header block */}
          <div className="px-3 py-2">
            <div className="text-sm font-medium text-ink">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-ink-muted truncate">
              {user.email}
            </div>
            <div className="mt-1.5">
              <Badge variant={user.role === 'admin' ? 'accent' : 'neutral'}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="my-1 border-t border-line" />

          {/* Links */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-muted transition-colors"
          >
            <User size={16} aria-hidden="true" />
            <span>Profile</span>
          </Link>

          {user.role === 'admin' && (
            <Link
              to="/flights"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-muted transition-colors"
            >
              <Plane size={16} aria-hidden="true" />
              <span>Browse flights</span>
            </Link>
          )}

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-muted transition-colors text-left"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

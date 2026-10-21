import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTabItems } from './navItems';
import { cn } from '../../lib/cn';

export const MobileTabBar = () => {
  const { user } = useAuth();
  const tabs = getTabItems(user);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="grid auto-cols-fr grid-flow-col">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                    isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
                  )
                }
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;

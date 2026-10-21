import {
  Plane,
  Ticket,
  LayoutDashboard,
  Users,
  LogIn,
  UserPlus,
  User
} from 'lucide-react';

export const getNavItems = (user) => {
  if (!user) {
    return [
      { to: '/flights', label: 'Flights', icon: Plane }
    ];
  }

  if (user.role === 'admin') {
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/flights', label: 'Flights', icon: Plane },
      { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
      { to: '/admin/users', label: 'Users', icon: Users }
    ];
  }

  return [
    { to: '/flights', label: 'Flights', icon: Plane },
    { to: '/my-bookings', label: 'My bookings', icon: Ticket }
  ];
};

export const getTabItems = (user) => {
  if (!user) {
    return [
      { to: '/flights', label: 'Flights', icon: Plane },
      { to: '/login', label: 'Sign in', icon: LogIn },
      { to: '/register', label: 'Sign up', icon: UserPlus }
    ];
  }

  if (user.role === 'admin') {
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/flights', label: 'Flights', icon: Plane },
      { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/profile', label: 'Profile', icon: User }
    ];
  }

  return [
    { to: '/flights', label: 'Flights', icon: Plane },
    { to: '/my-bookings', label: 'Bookings', icon: Ticket },
    { to: '/profile', label: 'Profile', icon: User }
  ];
};

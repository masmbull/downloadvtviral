'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Download, Activity, Lock, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/components/admin-auth-provider';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAdminAuth();

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/status', label: 'Status' },
  ];

  const privateLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/admin', label: 'Admin' },
      ]
    : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">
              DownloadVTViral
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                >
                  {link.label === 'Status' && <Activity className="w-4 h-4" />}
                  {link.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated && privateLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-sm font-medium text-red-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            )}
            {!isAuthenticated && (
              <Link href="/admin/login">
                <Button
                  variant="ghost"
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Lock className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {publicLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm font-medium"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {isAuthenticated && privateLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm font-medium"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-medium text-red-500"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
              {!isAuthenticated && (
                <Link href="/admin/login" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm font-medium"
                  >
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Form' },
    { href: '/data', label: 'Data Table' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">FormFire Data</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="md:hidden">
            {/* Mobile menu could be added here if needed */}
        </div>
      </div>
    </header>
  );
}

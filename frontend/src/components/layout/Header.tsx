'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-bold">Informed Voter</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:space-x-6">
          <Link href="/search" className="text-sm font-medium transition-colors hover:text-primary">
            Search Candidates
          </Link>
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
            How It Works
          </Link>
        </nav>

        {/* Right side buttons */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Link href="/search" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/candidate/submit">
            <Button variant="outline" size="sm">
              I'm a Candidate
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="container border-t py-4 md:hidden">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/search"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search Candidates
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

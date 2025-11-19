'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="bg-gradient-to-b from-primary/10 to-background py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Vote Based on{' '}
            <span className="text-primary">Actions</span>, Not Labels
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Discover candidates in your area and compare what they say with what they actually vote for.
            No party labels. Just facts.
          </p>

          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your city, zip code, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base"
              />
              <Button type="submit" size="lg" className="px-8">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/search?state=CA')}>
              California
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/search?state=TX')}>
              Texas
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/search?state=NY')}>
              New York
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/search?state=FL')}>
              Florida
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

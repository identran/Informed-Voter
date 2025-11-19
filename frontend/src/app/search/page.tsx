'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { candidatesAPI } from '@/lib/api/candidates';
import { CandidateCard } from '@/components/candidate/CandidateCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('state') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', 'search', searchQuery],
    queryFn: () =>
      candidatesAPI.search({
        state: searchQuery,
        page: 1,
        limit: 20,
      }),
    enabled: !!searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Search Candidates</h1>
        <p className="text-lg text-muted-foreground">
          Find candidates running in your area
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter city, zip code, or state..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center">
          <p>Loading candidates...</p>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div>
          <p className="mb-6 text-sm text-muted-foreground">
            Found {data.pagination.total} candidate{data.pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No candidates found for "{searchQuery}". Try a different search.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter a location to search for candidates in your area.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

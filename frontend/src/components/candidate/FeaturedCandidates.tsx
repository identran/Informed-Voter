'use client';

import { useQuery } from '@tanstack/react-query';
import { candidatesAPI } from '@/lib/api/candidates';
import { CandidateCard } from './CandidateCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FeaturedCandidates() {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', 'featured'],
    queryFn: () => candidatesAPI.search({ limit: 6 }),
  });

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold">Featured Candidates</h2>
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Featured Candidates</h2>
          <p className="text-lg text-muted-foreground">
            Recently verified candidate profiles
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/search">
            <Button size="lg">View All Candidates</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar } from 'lucide-react';
import type { Candidate } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const electionDate = candidate.electionDate
    ? new Date(candidate.electionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex items-start justify-between">
          <CardTitle className="text-xl">{candidate.name}</CardTitle>
          {candidate.isIncumbent && (
            <Badge variant="secondary" className="ml-2">
              Incumbent
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium text-primary">{candidate.office}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {candidate.district && `District ${candidate.district}, `}
              {candidate.city && `${candidate.city}, `}
              {candidate.state}
            </span>
          </div>

          {electionDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Election: {electionDate}</span>
            </div>
          )}
        </div>

        <p className="mt-4 line-clamp-3 text-sm">
          {candidate.reasonForRunning || candidate.bio}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        <Link href={`/candidates/${candidate.id}`} className="flex-1">
          <Button variant="default" className="w-full">
            View Profile
          </Button>
        </Link>
        {candidate.isIncumbent && (
          <Link href={`/candidates/${candidate.id}/compare`} className="flex-1">
            <Button variant="outline" className="w-full">
              Says vs Does
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

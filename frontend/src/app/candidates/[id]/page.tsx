'use client';

import { useQuery } from '@tanstack/react-query';
import { candidatesAPI } from '@/lib/api/candidates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Globe, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CandidatePage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate', params.id],
    queryFn: () => candidatesAPI.getById(params.id),
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <p>Loading candidate profile...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container py-12">
        <p>Candidate not found.</p>
      </div>
    );
  }

  const candidate = data.data;
  const electionDate = candidate.electionDate
    ? new Date(candidate.electionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">{candidate.name}</h1>
            <p className="text-xl font-medium text-primary">{candidate.office}</p>
          </div>
          <div className="flex gap-2">
            {candidate.isIncumbent && (
              <Badge variant="secondary" className="h-fit">
                Incumbent
              </Badge>
            )}
            <Badge variant="outline" className="h-fit">
              Verified
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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

        {candidate.isIncumbent && (
          <div className="mt-6">
            <Link href={`/candidates/${candidate.id}/compare`}>
              <Button size="lg">View Says vs Does Comparison</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Why Running */}
          <Card>
            <CardHeader>
              <CardTitle>Why I'm Running</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.reasonForRunning}</p>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Background</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.bio}</p>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Goals & Proposed Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.goals}</p>
            </CardContent>
          </Card>

          {/* Stances */}
          {candidate.stances && candidate.stances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Policy Positions</CardTitle>
                <CardDescription>
                  The candidate's stated positions on key issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.stances.map((cs) => (
                    <div key={cs.id} className="border-b pb-4 last:border-0">
                      <h4 className="mb-1 font-semibold">{cs.stance.title}</h4>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {cs.stance.description}
                      </p>
                      <p className="text-sm">{cs.position}</p>
                      {cs.sourceUrl && (
                        <a
                          href={cs.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {candidate.website && (
                <a
                  href={candidate.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a
                  href={`tel:${candidate.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {candidate.phone}
                </a>
              )}
            </CardContent>
          </Card>

          {/* Election Info */}
          {electionDate && (
            <Card>
              <CardHeader>
                <CardTitle>Election Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Election Date</p>
                  <p className="text-muted-foreground">{electionDate}</p>
                </div>
                <div>
                  <p className="font-medium">Office</p>
                  <p className="text-muted-foreground">{candidate.office}</p>
                </div>
                {candidate.district && (
                  <div>
                    <p className="font-medium">District</p>
                    <p className="text-muted-foreground">{candidate.district}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

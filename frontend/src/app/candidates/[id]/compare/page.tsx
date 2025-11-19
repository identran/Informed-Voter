'use client';

import { useQuery } from '@tanstack/react-query';
import { candidatesAPI } from '@/lib/api/candidates';
import { votingRecordsAPI } from '@/lib/api/votingRecords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ComparePage({ params }: { params: { id: string } }) {
  const { data: candidateData } = useQuery({
    queryKey: ['candidate', params.id],
    queryFn: () => candidatesAPI.getById(params.id),
  });

  const { data: comparisonsData, isLoading } = useQuery({
    queryKey: ['comparisons', params.id],
    queryFn: () => votingRecordsAPI.getAllComparisons(params.id),
    enabled: !!candidateData?.data,
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <p>Loading comparison data...</p>
      </div>
    );
  }

  const candidate = candidateData?.data;
  const comparisons = comparisonsData?.data || [];

  if (!candidate) {
    return (
      <div className="container py-12">
        <p>Candidate not found.</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/candidates/${params.id}`}
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← Back to profile
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Says vs Does</h1>
        <p className="text-xl text-muted-foreground">
          Comparing {candidate.name}'s stated positions with their voting record
        </p>
      </div>

      {/* Legend */}
      <Card className="mb-8">
        <CardContent className="flex gap-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Consistent</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm">Inconsistent</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gray-600" />
            <span className="text-sm">Unclear</span>
          </div>
        </CardContent>
      </Card>

      {/* Comparisons */}
      {comparisons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No voting records available for comparison yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {comparisons.map((comparison) => (
            <Card key={comparison.stance.id}>
              <CardHeader>
                <CardTitle>{comparison.stance.title}</CardTitle>
                <CardDescription>{comparison.stance.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stated Position */}
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <h4 className="mb-2 font-semibold">What They Say</h4>
                  <p className="text-sm">{comparison.statedPosition || 'No position stated'}</p>
                  {comparison.sourceUrl && (
                    <a
                      href={comparison.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-primary hover:underline"
                    >
                      View source
                    </a>
                  )}
                </div>

                {/* Voting Record */}
                <div>
                  <h4 className="mb-4 font-semibold">What They Voted For</h4>
                  {comparison.votes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No related votes on record.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comparison.votes.map((voteData, index) => (
                        <div key={index} className="border-l-4 border-muted pl-4">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <h5 className="font-medium">{voteData.bill.title}</h5>
                            <Badge
                              variant={
                                voteData.vote.vote === 'YES'
                                  ? 'default'
                                  : voteData.vote.vote === 'NO'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {voteData.vote.vote}
                            </Badge>
                          </div>
                          {voteData.bill.summary && (
                            <p className="mb-2 text-sm text-muted-foreground">
                              {voteData.bill.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(voteData.vote.voteDate).toLocaleDateString()}
                            </span>
                            <a
                              href={voteData.vote.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Official record
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

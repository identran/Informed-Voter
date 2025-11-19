'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { candidatesAPI } from '@/lib/api/candidates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function CandidateSubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    office: '',
    district: '',
    state: '',
    city: '',
    county: '',
    bio: '',
    goals: '',
    reasonForRunning: '',
    isIncumbent: false,
  });

  const mutation = useMutation({
    mutationFn: candidatesAPI.create,
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="pt-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold">Profile Submitted!</h2>
            <p className="mb-6 text-muted-foreground">
              Thank you for submitting your candidate profile. Our team will review it for
              verification. You'll receive an email notification once your profile is approved.
            </p>
            <Button onClick={() => (window.location.href = '/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold">Submit Candidate Profile</h1>
          <p className="text-lg text-muted-foreground">
            Create your candidate profile to appear on the Informed Voter Platform. All
            submissions are reviewed for verification before going live.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Content Guidelines</CardTitle>
            <CardDescription>Please review before submitting</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>No party affiliation references</li>
              <li>No mentions of opposing candidates</li>
              <li>Bio limited to 1000 words (approximately 6000 characters)</li>
              <li>Goals limited to 500 words (approximately 3000 characters)</li>
              <li>All content subject to moderation</li>
            </ul>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email *</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Campaign Website</label>
                <Input
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Electoral Information */}
          <Card>
            <CardHeader>
              <CardTitle>Electoral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Office Running For *</label>
                <Input
                  name="office"
                  placeholder="e.g., U.S. Senator, State Representative, City Council"
                  value={formData.office}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">State *</label>
                <Input
                  name="state"
                  placeholder="e.g., CA, TX, NY"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">District</label>
                  <Input
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Why Are You Running? *
                </label>
                <textarea
                  name="reasonForRunning"
                  value={formData.reasonForRunning}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.reasonForRunning.length}/2000 characters
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Background & Bio *</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={6000}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.bio.length}/6000 characters
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Goals & Proposed Changes *
                </label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  maxLength={3000}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.goals.length}/3000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => (window.location.href = '/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit Profile'}
            </Button>
          </div>

          {mutation.isError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  Error submitting profile. Please check your information and try again.
                </p>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}

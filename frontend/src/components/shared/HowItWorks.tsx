import { Search, FileCheck, Scale, Vote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    icon: Search,
    title: 'Search Your Area',
    description: 'Enter your location to find candidates running in your district for local, state, and federal positions.',
  },
  {
    icon: FileCheck,
    title: 'Review Positions',
    description: 'Read candidate bios, goals, and their stated positions on key issues like healthcare, education, and climate.',
  },
  {
    icon: Scale,
    title: 'Compare Records',
    description: 'For incumbents, see their actual voting record alongside their stated positions to evaluate consistency.',
  },
  {
    icon: Vote,
    title: 'Make Informed Choices',
    description: 'Cast your vote based on verified facts and voting records, not party labels or campaign promises alone.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Four simple steps to become a more informed voter
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="absolute right-6 top-6 text-4xl font-bold text-muted opacity-20">
                  {index + 1}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

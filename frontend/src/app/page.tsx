import { SearchHero } from "@/components/search/SearchHero";
import { FeaturedCandidates } from "@/components/candidate/FeaturedCandidates";
import { HowItWorks } from "@/components/shared/HowItWorks";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Search */}
      <SearchHero />

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Candidates */}
      <FeaturedCandidates />

      {/* Mission Statement */}
      <section className="border-t bg-muted/50 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              The Informed Voter Platform empowers citizens to make educated decisions
              by providing transparent, non-partisan information about political candidates.
              We believe voters should evaluate candidates based on their actual record
              and positions, not party labels.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

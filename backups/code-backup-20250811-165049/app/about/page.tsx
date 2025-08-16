import { AboutHero } from "./_components/about-hero";
import { AboutMission } from "./_components/about-mission";
import { AboutTeam } from "./_components/about-team";
import { AboutValues } from "./_components/about-values";
import { AboutTestimonials } from "./_components/about-testimonials";
import { AboutCTA } from "./_components/about-cta";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutTeam />
      <AboutTestimonials />
      <AboutCTA />
    </div>
  );
}
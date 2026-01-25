"use client";

import { HomeNavbar } from "@/app/(homepage)/components/HomeNavbar";
import { HomeFooter } from "@/app/(homepage)/HomeFooter";
import {
  HeroSection,
  HowItWorksSection,
  LevelExplorerSection,
  CTASection,
} from "./components";

export default function BloomsTaxonomyPage() {
  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden selection:bg-purple-500/30">
      <HomeNavbar />

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-pink-900/10 rounded-full blur-[100px] animate-pulse-slow delay-2000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero: Master Any Subject with Cognitive Science */}
        <HeroSection />

        {/* How Our Engine Works - Interactive demo */}
        <HowItWorksSection />

        {/* Explore the 6 Levels - Interactive card explorer */}
        <LevelExplorerSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      <HomeFooter />
    </div>
  );
}

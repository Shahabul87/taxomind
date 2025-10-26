'use client';

import EnergyCoin from '@/components/graphics/EnergyCoin';
import EmptyCoin from '@/components/graphics/EmptyCoin';
import SpeechBubble from '@/components/graphics/SpeechBubble';

export default function MotivationSection() {
  return (
    <section
      role="region"
      aria-labelledby="motivation-heading"
      className="relative overflow-hidden bg-gradient-to-br from-motivation-start to-motivation-end py-24"
    >
      {/* Subtle vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-transparent via-transparent to-motivation-vignette opacity-30" aria-hidden="true" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 lg:gap-16">
          {/* Left: Visual Cluster (Decorative) */}
          <div className="relative flex items-center justify-center md:col-span-5">
            <div className="relative h-[280px] w-full max-w-[400px] sm:h-[320px] md:h-[360px]">
              {/* Empty coin (background layer) */}
              <div className="absolute left-0 top-8 z-0 scale-90 opacity-60 sm:left-4 sm:top-12">
                <EmptyCoin />
              </div>

              {/* Large energy coin */}
              <div className="absolute left-12 top-0 z-10 sm:left-20 sm:top-4">
                <EnergyCoin size="lg" />
                {/* Day label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground" aria-hidden="true">
                  T
                </div>
              </div>

              {/* Medium energy coin */}
              <div className="absolute left-32 top-16 z-20 sm:left-44 sm:top-20">
                <EnergyCoin size="md" />
                {/* Day label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground" aria-hidden="true">
                  W
                </div>
              </div>

              {/* Small energy coin */}
              <div className="absolute bottom-12 left-24 z-30 sm:bottom-16 sm:left-32">
                <EnergyCoin size="sm" />
                {/* Day label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground" aria-hidden="true">
                  Th
                </div>
              </div>

              {/* Speech bubble notification */}
              <div className="absolute bottom-0 right-0 z-40 sm:bottom-4 sm:right-8">
                <SpeechBubble text="Reach your daily goal, Skylar!" tilt={-2} />
              </div>
            </div>
          </div>

          {/* Right: Copy Block */}
          <div className="md:col-span-7">
            <div className="max-w-prose">
              <h2
                id="motivation-heading"
                className="mb-6 text-[clamp(2.25rem,4vw+1rem,5rem)] font-bold leading-[1.1] tracking-tight text-foreground"
              >
                Stay
                <br />
                motivated
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Build a streak and stay on track with daily goals. Every small win counts toward
                mastering new skills and reaching your learning milestones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

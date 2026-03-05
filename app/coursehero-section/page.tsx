"use client";

import { useState } from "react";
import { HeroDesign1 } from "./_components/design-1-observatory";
import { HeroDesign2 } from "./_components/design-2-broadsheet";
import { HeroDesign3 } from "./_components/design-3-topography";
import { HeroDesign4 } from "./_components/design-4-brutalist";
import { HeroDesign5 } from "./_components/design-5-greenhouse";

const DESIGNS = [
  { id: 1, name: "The Observatory", subtitle: "Celestial deep-space aesthetic" },
  { id: 2, name: "The Broadsheet", subtitle: "Editorial newspaper layout" },
  { id: 3, name: "The Topography", subtitle: "Terrain contour map explorer" },
  { id: 4, name: "The Brutalist", subtitle: "Raw concrete & bold type" },
  { id: 5, name: "The Greenhouse", subtitle: "Organic botanical growth" },
];

const stats = { totalCourses: 248, totalEnrollments: 12840, averageRating: 4.7 };

export default function CourseHeroShowcasePage() {
  const [activeDesign, setActiveDesign] = useState(1);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      {/* Sticky nav for switching designs */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9999,
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          overflowX: "auto",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            flexShrink: 0,
            marginRight: 8,
          }}
        >
          Hero Designs
        </span>
        {DESIGNS.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDesign(d.id)}
            style={{
              flexShrink: 0,
              padding: "8px 20px",
              borderRadius: 6,
              border: activeDesign === d.id ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              background: activeDesign === d.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: activeDesign === d.id ? "#fff" : "rgba(255,255,255,0.45)",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "system-ui",
            }}
          >
            <strong style={{ marginRight: 6 }}>#{d.id}</strong>
            {d.name}
          </button>
        ))}
      </nav>

      {/* Design label */}
      <div
        style={{
          textAlign: "center",
          padding: "32px 24px 0",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontSize: 14,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            opacity: 0.4,
          }}
        >
          Design #{activeDesign} &mdash;{" "}
          {DESIGNS.find((d) => d.id === activeDesign)?.name}
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 12,
            fontFamily: "monospace",
            marginTop: 4,
          }}
        >
          {DESIGNS.find((d) => d.id === activeDesign)?.subtitle}
        </p>
      </div>

      {/* Render active design */}
      <div style={{ marginTop: 24 }}>
        {activeDesign === 1 && <HeroDesign1 statistics={stats} />}
        {activeDesign === 2 && <HeroDesign2 statistics={stats} />}
        {activeDesign === 3 && <HeroDesign3 statistics={stats} />}
        {activeDesign === 4 && <HeroDesign4 statistics={stats} />}
        {activeDesign === 5 && <HeroDesign5 statistics={stats} />}
      </div>
    </div>
  );
}

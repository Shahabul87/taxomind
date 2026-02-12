/**
 * Design & Creative Category Prompt Enhancer (ARROW-Based)
 *
 * Covers: UI/UX Design, Graphic Design, Product Design, Web Design,
 * Brand Design, Motion Graphics, 3D Design, Interior Design,
 * Typography, Color Theory, Design Systems
 *
 * Research basis:
 * - ARROW Framework: Application-first, reverse-engineer, intuition before formalism
 * - Stanford d.school Design Thinking (Empathize → Define → Ideate → Prototype → Test)
 * - Bauhaus pedagogy: learn by making, foundation before specialization
 * - Don Norman's design principles (The Design of Everyday Things)
 * - Critique-based learning (Rhode Island School of Design model)
 * - Portfolio-driven assessment (Pratt, Parsons)
 */

import type { CategoryPromptEnhancer } from './types';

export const designCreativeEnhancer: CategoryPromptEnhancer = {
  categoryId: 'design-creative',
  displayName: 'Design & Creative',
  matchesCategories: [
    'UI Design',
    'UX Design',
    'UI/UX Design',
    'Graphic Design',
    'Product Design',
    'Web Design',
    'Brand Design',
    'Motion Graphics',
    '3D Design',
    'Interior Design',
    'Typography',
    'Color Theory',
    'Design Systems',
    'Design',
    'Industrial Design',
    'Fashion Design',
    'Animation',
    'Illustration',
    'Visual Design',
    'User Experience',
    'User Interface',
    'Interaction Design',
  ],

  domainExpertise: `You are also a senior design professional and creative director who has shipped products used by millions. You teach by showing great design first, then reverse-engineering why it works.

You follow the ARROW teaching philosophy:
- NEVER start with "The principles of design are..." — start with "Why does the iPhone feel inevitable? Why did Google's original homepage beat Yahoo's cluttered portal? Let's reverse-engineer the decisions."
- NEVER start with theory — start with a design that WORKS and makes students feel its impact
- Show the finished design FIRST, then decompose the decisions, build visual intuition, THEN introduce design principles
- Every principle must EARN its place by explaining a design the student has already experienced
- Design is fundamentally about empathy — understanding what people need before they can articulate it

You understand:
- The difference between KNOWING principles and SEEING like a designer
- That great design is invisible — users notice bad design, not good design
- That the best design education combines critique, practice, and reflection
- That design failures (confusing interfaces, ugly products, harmful UX patterns) teach as much as successes
- That design is multidisciplinary — it connects psychology, technology, business, and aesthetics
- That design thinking is a transferable skill — it applies to problems far beyond visual design`,

  teachingMethodology: `## DESIGN TEACHING METHODOLOGY (ARROW-Based)

### The ARROW Cycle for Design
Every chapter follows this arc:
1. **APPLICATION FIRST**: Show a design masterwork. "Look at Dieter Rams' Braun T3 radio from 1958. It influenced the iPhone 50 years later. What makes it timeless?"
2. **REVERSE ENGINEER**: Decompose the design decisions — layout, hierarchy, color, typography, spacing, interaction patterns. WHY each choice was made.
3. **INTUITION BUILDING**: Build visual intuition through comparison. Show two versions — one that works, one that doesn't — and ask students to FEEL the difference before analyzing it.
4. **THEORY & PRINCIPLES**: Introduce formal design principles (proximity, alignment, repetition, contrast, hierarchy) as LANGUAGE for what students already feel intuitively.
5. **FAILURE ANALYSIS**: Show design failures. Bad UX flows, confusing interfaces, harmful dark patterns. Ask students to diagnose before prescribing.
6. **DESIGN CHALLENGE**: Constrained design brief. "Redesign the checkout flow for elderly users. Maximum 3 screens. No text smaller than 16px. 10-second task completion."

### Critique-Based Learning (RISD Method + ARROW)
1. Student presents their work
2. Peers describe what they SEE (not judge — observe)
3. Peers analyze what WORKS and what creates friction
4. Designer explains their INTENT — does the perception match the intention?
5. Group suggests IMPROVEMENTS — specific, actionable, kind
6. Student ITERATES — revises and presents again

### Core Principles
1. **Show, Don't Tell**: Design is visual. Every concept must be demonstrated with real examples, not just described in text.
2. **Constraints Breed Creativity**: The best design work comes from tight constraints, not unlimited freedom.
3. **Empathy Before Aesthetics**: Understand the user before choosing colors. Who are they? What are they trying to do? What frustrates them?
4. **Iteration is the Process**: First drafts are always wrong. Design is refinement. Show the evolution, not just the final result.
5. **Steal Like an Artist**: Study great work, understand WHY it works, then adapt the principles (not the surface).`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall design terminology, identify visual patterns, name design principles and elements',
      exampleObjectives: [
        'Identify the Gestalt principles (proximity, similarity, closure, continuity) in existing designs',
        'List the components of a design system (tokens, atoms, molecules, organisms, templates)',
        'Name the standard UI patterns for navigation, forms, feedback, and content display',
      ],
      exampleActivities: [
        'Pattern recognition: identify which Gestalt principle is at work in 10 different design examples',
        'Vocabulary building: match design terms (kerning, leading, hierarchy, whitespace) to visual examples',
        'UI pattern library: catalog and name the interaction patterns in a popular app',
      ],
    },
    UNDERSTAND: {
      means: 'Explain WHY design decisions work, interpret visual hierarchy, describe user mental models',
      exampleObjectives: [
        'Explain why Apple uses generous whitespace and how it affects perceived quality and readability',
        'Interpret a user flow diagram and identify where users are most likely to drop off and why',
        'Describe how color psychology affects user behavior in e-commerce contexts with specific examples',
      ],
      exampleActivities: [
        'Design comparison: given two versions of the same interface, explain which works better and WHY (not just preference)',
        'User journey mapping: trace a user through an experience and explain emotional states at each touchpoint',
        'Visual hierarchy analysis: annotate a webpage showing the reading order and explain what drives eye movement',
      ],
    },
    APPLY: {
      means: 'Create designs following established patterns, apply principles to solve defined problems',
      exampleObjectives: [
        'Design a responsive landing page that follows visual hierarchy principles and guides users to a CTA',
        'Apply the 60-30-10 color rule to create a cohesive color palette for a brand',
        'Create a user flow for a specific task (onboarding, checkout, settings) following established UX patterns',
      ],
      exampleActivities: [
        'Design exercise: given a wireframe and brand guidelines, create a high-fidelity mockup in Figma',
        'Component creation: design a reusable form component system with states (default, focus, error, disabled)',
        'Responsive adaptation: take a desktop design and create mobile and tablet versions following responsive principles',
      ],
    },
    ANALYZE: {
      means: 'Diagnose design problems, conduct usability analysis, identify UX friction points',
      exampleObjectives: [
        'Conduct a heuristic evaluation of a real app using Nielsen\'s 10 usability heuristics and prioritize findings',
        'Analyze the design system of a major product (Material Design, Apple HIG) and identify the underlying principles',
        'Identify dark patterns in a commercial product and explain how they manipulate user behavior',
      ],
      exampleActivities: [
        'UX audit: evaluate a real website for accessibility, usability, and visual design issues',
        'Competitive analysis: compare 3 competing products and map their different design approaches to user needs',
        'Design system teardown: reverse-engineer the token system (spacing, typography, color) of a major product',
      ],
    },
    EVALUATE: {
      means: 'Critique designs against user needs, assess design quality, justify design decisions',
      exampleObjectives: [
        'Evaluate a peer\'s design against the design brief and user research, providing actionable feedback',
        'Assess whether a design system is complete and consistent enough for team adoption',
        'Justify your design decisions in a presentation to stakeholders, connecting each choice to user needs and business goals',
      ],
      exampleActivities: [
        'Design critique: provide structured feedback on a design using the "I like / I wish / What if" framework',
        'Usability testing analysis: watch 3 user test recordings and synthesize findings into design recommendations',
        'Design defense: present your design to a panel and defend decisions against challenges',
      ],
    },
    CREATE: {
      means: 'Design original solutions, create design systems, develop brand identities from scratch',
      exampleObjectives: [
        'Design a complete design system for a new product including tokens, components, patterns, and documentation',
        'Create a brand identity (logo, color palette, typography, voice) for a new company from a creative brief',
        'Design an innovative interaction pattern that solves a specific usability problem in a novel way',
      ],
      exampleActivities: [
        'End-to-end design: from user research to final prototype, design a complete feature for a specified user need',
        'Constrained design sprint: "Design a banking app for users who are visually impaired. 4 hours. Present and test."',
        'Brand creation: develop a complete visual identity for a startup from scratch, including rationale document',
      ],
    },
  },

  contentTypeGuidance: `## CONTENT TYPE SELECTION FOR DESIGN COURSES

Design courses need a VISUAL + HANDS-ON balance with strong critique:

| Content Type | Usage | Best For |
|-------------|-------|----------|
| **video** | 25-30% | Design process walkthroughs, tool tutorials (Figma, Sketch), live design sessions. ESSENTIAL — design is visual. Show, don't just tell. |
| **reading** | 15-20% | Design principles, case studies, UX research methods, design history. Always include visual examples — never text-only theory. |
| **assignment** | 30-35% | Design exercises with constraints, redesign challenges, component creation, user flow design. CORE of design learning. |
| **quiz** | 5% | Principle identification, terminology checks, pattern recognition. Keep minimal — design isn't about recall. |
| **project** | 20-25% | Full design projects with research, ideation, prototyping, and testing. Portfolio-worthy. Every 2-3 chapters. |
| **discussion** | 5-10% | Design critiques, ethical discussions (dark patterns, inclusive design), trend analysis. Important for developing design taste. |

### Rules:
- Every principle MUST be shown with visual examples — never teach design principles as text-only
- Include side-by-side "before/after" comparisons whenever possible
- Design exercises must have CONSTRAINTS — "Design anything" teaches nothing; "Design a login for elderly users in 2 screens" teaches everything
- Include real user feedback/testing in at least one project per course
- Show the PROCESS, not just the final result — early sketches, iterations, dead ends`,

  qualityCriteria: `## DESIGN COURSE QUALITY CRITERIA

A chapter is HIGH QUALITY when it:
1. **Opens with inspiration** — shows a design that makes students want to create, not a list of principles
2. **Teaches visually** — every concept is demonstrated with real examples, comparisons, and annotations
3. **Includes iteration** — shows the design process, including early drafts, wrong turns, and refinements
4. **Uses real products** — references designs students actually use (apps, websites, physical products)
5. **Connects to users** — every design decision ties back to a human need, behavior, or emotion
6. **Includes critique** — teaches students to give and receive feedback constructively
7. **Challenges with constraints** — design briefs are specific, measurable, and constrained

A section is HIGH QUALITY when it:
1. **Has clear visual examples** — annotated screenshots, mockups, or diagrams for every concept
2. **Shows comparison** — good vs. bad, before vs. after, option A vs. option B
3. **Includes hands-on practice** — students design something, not just read about design
4. **Addresses accessibility** — inclusive design is not optional, it's a quality requirement
5. **Ends with reflection** — "What did you learn? How would you approach this differently?"`,

  chapterSequencingAdvice: `## DESIGN COURSE CHAPTER SEQUENCING

### ARROW-Based Sequencing for Design:
1. **Hook chapter**: Show stunning design work → "Why does this work?" → reverse-engineer the decisions → roadmap
2. **Foundation chapters**: Visual elements (color, type, space, shape) → principles (hierarchy, contrast, alignment) → build visual literacy
3. **Process chapters**: User research → ideation → wireframing → prototyping → testing → iteration
4. **Practice chapters**: Constrained design briefs → critique → iteration → portfolio pieces
5. **Integration chapter**: Complete design project from research to final prototype → design defense

### Sequencing Rules:
- **See before create**: Study existing great design before attempting to create your own
- **Principles before tools**: Understand WHY before learning Figma/Sketch — tool skills without taste produce mediocre work
- **Research before design**: Understand the user before opening the design tool
- **Wireframe before high-fidelity**: Structure before style — get the layout right before choosing colors
- **Components before systems**: Design individual elements before building design systems
- **Critique before solo projects**: Learn to see through others' work before assessing your own

### Cross-Domain Connections (Knowledge Graph):
- Design ↔ Psychology (perception, cognition, emotion, behavior)
- Design ↔ Business (value proposition, market positioning, conversion)
- Design ↔ Technology (feasibility, responsive design, performance)
- Design ↔ Accessibility (inclusive design, WCAG, assistive technologies)
- Design ↔ Ethics (dark patterns, manipulation, informed consent)`,

  activityExamples: {
    video: 'Live design session: open Figma and design a component from scratch, narrating every decision. "I\'m choosing 16px padding because..." Show mistakes and revisions. Then compare to how major design systems (Material, Apple HIG) solve the same problem.',
    reading: 'Design principle with ARROW structure: (1) Show a design that exemplifies the principle — annotated screenshot, (2) Reverse-engineer WHY it works — break down the visual decisions, (3) Show a design that VIOLATES the principle — annotated comparison, (4) Formalize the principle with name and definition, (5) Gallery of 5+ real examples applying the principle across different contexts.',
    assignment: 'Constrained redesign: Part A — Audit the current design of [real app screen] for usability issues. Part B — Redesign it with these constraints: [accessibility requirement], [device constraint], [user persona]. Part C — Create a before/after comparison annotating every change and WHY you made it.',
    quiz: 'Visual identification: show 5 interfaces and identify which design principles are being used or violated. Practical: "This button has 3.2:1 contrast ratio. Does it pass WCAG AA? What would you change?"',
    project: 'End-to-end design sprint: (1) Conduct user research (interviews or surveys) for a specified problem, (2) Define user personas and journey maps, (3) Ideate solutions (sketches), (4) Create wireframes, (5) Build interactive prototype in Figma, (6) Conduct 3 usability tests, (7) Iterate based on findings, (8) Present final design with rationale document.',
    discussion: 'Design ethics debate: "Is this a dark pattern or a legitimate business decision?" Show real examples (e.g., subscription cancellation flows, cookie consent banners, urgency messaging). Discuss where the line is and who gets to draw it.',
  },
};

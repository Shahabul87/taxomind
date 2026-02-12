/**
 * Lifestyle Category Prompt Enhancer (ARROW-Based)
 *
 * Covers: Cooking, Travel, Gardening, Pet Care, Home Improvement,
 * Fashion, Parenting, DIY, Crafts, Interior Design, Photography (hobby),
 * Sustainable Living
 *
 * Research basis:
 * - ARROW Framework: Application-first, reverse-engineer, intuition before formalism
 * - Experiential Learning (Kolb): Concrete experience → reflective observation → abstract conceptualization → active experimentation
 * - Legitimate Peripheral Participation (Lave & Wenger): Learning through community and practice
 * - Cognitive Apprenticeship (Collins): Modeling → coaching → scaffolding → fading
 * - Maker Movement pedagogy: Learn by building, iterating, and sharing
 */

import type { CategoryPromptEnhancer } from './types';

export const lifestyleEnhancer: CategoryPromptEnhancer = {
  categoryId: 'lifestyle',
  displayName: 'Lifestyle',
  matchesCategories: [
    'Lifestyle',
    'Cooking',
    'Travel',
    'Gardening',
    'Pet Care',
    'Home Improvement',
    'Fashion',
    'Parenting',
    'DIY',
    'Crafts',
    'Interior Design',
    'Sustainable Living',
    'Home Organization',
    'Entertaining',
    'Wine',
    'Baking',
    'Sewing',
    'Woodworking',
    'Photography Hobby',
    'Homesteading',
  ],

  domainExpertise: `You are also an experienced lifestyle educator and practical skills teacher who has taught hands-on skills to complete beginners and helped them build real competence through doing, not just watching.

You follow the ARROW teaching philosophy:
- NEVER start with "Cooking is the art of preparing food..." — start with "You are about to make the best scrambled eggs of your life. Three ingredients, four minutes, and one technique that changes everything."
- NEVER start with history or theory — start with DOING something immediately satisfying
- Show the finished result FIRST, then decompose the technique, build intuition through sensory experience, THEN explain the science or principles behind it
- Every principle must EARN its place by making the student's next attempt noticeably better
- Lifestyle skills are deeply personal — always connect techniques to the student's own home, kitchen, garden, or life context

You understand:
- The difference between KNOWING a recipe and UNDERSTANDING cooking — skills transfer across thousands of dishes
- That lifestyle learning is motivation-driven — students come because they WANT to, so engagement is everything
- That hands-on practice with real materials is irreplaceable — no amount of reading substitutes for doing
- That mistakes are the best teachers — burnt food, dead plants, and DIY disasters are learning opportunities
- That safety matters — kitchen safety, tool safety, food safety, and age-appropriate guidance are non-negotiable
- That sustainability and resourcefulness are core values — teach students to work with what they have`,

  teachingMethodology: `## LIFESTYLE TEACHING METHODOLOGY (ARROW-Based)

### The ARROW Cycle for Lifestyle Skills
Every chapter follows this arc:
1. **APPLICATION FIRST**: Hook with a stunning result. "This is the bread you will bake today. Crispy crust, soft interior, and it costs 50 cents. No bread machine needed."
2. **REVERSE ENGINEER**: Decompose the result into its components. What are the key techniques? What ingredients matter most? What equipment is essential vs. optional?
3. **INTUITION BUILDING**: Build sensory intuition through hands-on experience. "Touch the dough — it should feel like your earlobe. That is how you know the gluten is developed."
4. **THEORY & SCIENCE**: Explain the WHY behind the technique. "Gluten forms when flour proteins hydrate and are stretched. Kneading aligns the proteins into an elastic network. That is why the texture matters."
5. **FAILURE ANALYSIS**: Show common mistakes and how to fix them. "If your bread is dense, here are the 3 most likely causes — and yes, you have probably done #2."
6. **DESIGN CHALLENGE**: "Now modify this recipe for your constraints. No oven? Use a dutch oven on the stove. Gluten-free? Here is how to substitute and why you need xanthan gum. Make it your own."

### Core Principles
1. **Results From Day One**: Students complete a satisfying project in every chapter, even if simplified. Motivation comes from seeing your own work.
2. **Sensory-First Learning**: Teach through sight, touch, taste, smell, and sound — not just text. "What does properly caramelized onion LOOK like? SMELL like? What sound does the pan make?"
3. **Practical Over Perfect**: A finished imperfect project teaches more than an unfinished perfect one. Encourage iteration, not perfectionism.
4. **Budget and Resource Aware**: Not everyone has professional equipment. Always provide alternatives and budget-friendly options.
5. **Safety First, Always**: Tool safety, food safety, chemical safety, and age-appropriate guidance are included in every relevant section.`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall essential techniques, identify tools and materials, name key principles',
      exampleObjectives: [
        'Identify the 5 French mother sauces and describe the base technique for each',
        'List the essential tools for a beginner home garden and describe each tool\'s primary function',
        'Recall food safety temperature zones and storage guidelines for common ingredients',
      ],
      exampleActivities: [
        'Tool identification: match each tool to its function and identify which are essential vs. optional for a beginner setup',
        'Technique flashcards: identify basic techniques (dice, julienne, saute, braise) from descriptions and images',
        'Safety checklist: create a safety reference card for your specific activity area (kitchen, workshop, garden)',
      ],
    },
    UNDERSTAND: {
      means: 'Explain why techniques work, interpret recipes/plans, describe the science behind lifestyle skills',
      exampleObjectives: [
        'Explain why bread dough needs to rest and how gluten development affects texture, using a hands-on comparison of rested vs. unrested dough',
        'Interpret a garden planting calendar and explain why companion planting works based on nutrient cycles and pest management',
        'Describe how color theory applies to interior design and explain why certain combinations feel harmonious',
      ],
      exampleActivities: [
        'Science explanation: perform the same technique two ways (correct and incorrect) and explain the scientific reason for the difference in results',
        'Recipe interpretation: read a new recipe and explain what each step accomplishes — predict what would happen if you skipped step 3',
        'Analogy creation: explain a complex technique to a complete beginner using only everyday language and comparisons',
      ],
    },
    APPLY: {
      means: 'Execute techniques independently, follow plans with modifications, apply principles to new situations',
      exampleObjectives: [
        'Execute a complete recipe from start to finish, adjusting for available ingredients while maintaining the core technique',
        'Apply container gardening principles to grow 3 edible plants from seed to harvest in a small space',
        'Complete a home organization project for one room using the principles of zones, decluttering, and maintenance systems',
      ],
      exampleActivities: [
        'Technique execution: follow a step-by-step guide to complete a project, documenting each stage with photos and notes on what you observed',
        'Adaptation challenge: take a standard recipe/plan and adapt it for a specific constraint (dietary restriction, small space, limited budget)',
        'Skill practice: repeat a core technique 3 times with variations, tracking improvement between attempts',
      ],
    },
    ANALYZE: {
      means: 'Analyze what makes projects succeed or fail, evaluate ingredient/material quality, diagnose common problems',
      exampleObjectives: [
        'Analyze a failed baking attempt by examining each variable (temperature, timing, ingredient ratios) and identifying the root cause',
        'Evaluate the quality of produce/materials by applying sensory analysis criteria and explain how quality affects the final result',
        'Diagnose a struggling plant by examining leaves, soil, light, and watering patterns to identify the underlying issue',
      ],
      exampleActivities: [
        'Failure diagnosis: given a photo of a failed project (collapsed cake, leggy seedling, uneven paint), identify the cause and prescribe the fix',
        'Quality comparison: compare 3 versions of the same ingredient/material at different price points and analyze the impact on final results',
        'Root cause analysis: when something goes wrong with your project, document the issue, hypothesize 3 causes, test each, and report findings',
      ],
    },
    EVALUATE: {
      means: 'Judge quality of work, assess techniques critically, critique and improve existing approaches',
      exampleObjectives: [
        'Evaluate your own project against professional standards using a specific criteria framework and identify 3 improvement areas',
        'Assess whether a popular technique or trend is evidence-based or marketing-driven, citing specific examples',
        'Judge the sustainability and practicality of a lifestyle approach for your specific living situation and budget',
      ],
      exampleActivities: [
        'Self-critique: complete a project, then evaluate it against a professional rubric — score yourself honestly and write an improvement plan',
        'Trend evaluation: research a popular lifestyle trend (e.g., air fryer cooking, no-dig gardening, capsule wardrobe) and evaluate the claims vs. reality',
        'Peer review: exchange project photos and plans with a peer, provide constructive feedback using the chapter\'s quality criteria',
      ],
    },
    CREATE: {
      means: 'Design original projects, develop personal systems, create unique solutions for lifestyle challenges',
      exampleObjectives: [
        'Design an original recipe/project that combines techniques from at least 3 different chapters, with documented rationale for each choice',
        'Create a seasonal plan for your specific context (garden plan, meal plan, home maintenance schedule) with budget and timeline',
        'Develop a personal system for a lifestyle challenge (meal prep, garden maintenance, home organization) that is sustainable for 6+ months',
      ],
      exampleActivities: [
        'Original creation: design and execute an original project using techniques learned throughout the course — document the creative process',
        'System design: create a complete management system for your lifestyle area (weekly meal plan, garden calendar, maintenance schedule) customized to your constraints',
        'Teaching project: create a step-by-step guide that teaches your favorite technique to a complete beginner — test it with someone who has never tried it',
      ],
    },
  },

  contentTypeGuidance: `## CONTENT TYPE SELECTION FOR LIFESTYLE COURSES

Lifestyle courses need a HANDS-ON + VISUAL + ITERATIVE balance:

| Content Type | Usage | Best For |
|-------------|-------|----------|
| **video** | 30-35% | Technique demonstrations, step-by-step walkthroughs, before/after reveals, sensory cues. ESSENTIAL — most lifestyle skills are visual and physical. |
| **reading** | 10-15% | Background science, reference materials, safety guidelines, planning templates. Keep brief — students want to DO, not read. |
| **assignment** | 30-35% | Hands-on practice, technique execution, project completion, adaptation challenges. CORE of lifestyle learning. |
| **quiz** | 5% | Safety checks, technique identification, troubleshooting scenarios. Minimal but important for safety. |
| **project** | 15-20% | Complete projects, seasonal plans, original creations, system design. Every 2-3 chapters. |
| **discussion** | 5-10% | Sharing results, troubleshooting problems, regional/cultural variations, tips exchange. Community learning. |

### Rules:
- ALWAYS include visual demonstrations — text descriptions of physical techniques are insufficient
- Students must COMPLETE a project in every chapter, even if small
- Include budget-friendly and space-constrained alternatives — not everyone has a professional setup
- Safety warnings must be prominent and specific, never hidden in footnotes
- Encourage documentation (photos, notes) — it builds reflection skills and creates a personal reference
- Include seasonal and regional adaptations where relevant (gardening zones, seasonal ingredients)`,

  qualityCriteria: `## LIFESTYLE COURSE QUALITY CRITERIA

A chapter is HIGH QUALITY when it:
1. **Shows the result first** — opens with a beautiful, achievable finished project that motivates
2. **Teaches through doing** — students complete a hands-on project within the chapter
3. **Engages the senses** — describes what things should look, smell, feel, sound, or taste like
4. **Includes troubleshooting** — anticipates common problems and provides clear fixes
5. **Respects constraints** — offers alternatives for different budgets, spaces, and equipment levels
6. **Prioritizes safety** — includes relevant safety guidance without being overwhelming
7. **Encourages personalization** — teaches principles that students can adapt to their own context

A section is HIGH QUALITY when it:
1. **Has a visual anchor** — includes or references images, diagrams, or video of what the result looks like
2. **Provides sensory cues** — teaches students to use their senses as feedback (color of caramel, texture of soil, sound of a properly heated pan)
3. **Includes step-by-step guidance** — clear, numbered steps that a beginner can follow
4. **Addresses common mistakes** — explicitly warns about what can go wrong and how to prevent it
5. **Connects to daily life** — every skill relates to something students can use this week`,

  chapterSequencingAdvice: `## LIFESTYLE COURSE CHAPTER SEQUENCING

### ARROW-Based Sequencing for Lifestyle Skills:
1. **Hook chapter**: Stunning result → "You can do this today" → decompose the technique → build confidence → roadmap
2. **Foundation chapters**: Essential tools and safety → core techniques → basic science/principles → first complete project
3. **Skills chapters**: Intermediate techniques → ingredient/material knowledge → troubleshooting → adaptation skills
4. **Creative chapters**: Original projects → personal style → seasonal planning → sustainability
5. **Integration chapter**: Complete capstone project → personal system design → share and teach others

### Sequencing Rules:
- **Results before theory**: Complete a satisfying project before explaining why it works
- **Simple before complex**: Master basic techniques before combining them
- **Safety before technique**: Establish safe practices before advancing to challenging skills
- **Guided before independent**: Follow step-by-step, then adapt, then create from scratch
- **Single skill before combined**: Master individual techniques before projects requiring multiple skills
- **Seasonal awareness**: For gardening/cooking, respect natural timing and availability

### Cross-Domain Connections (Knowledge Graph):
- Science ↔ Technique (chemistry → cooking, biology → gardening, physics → DIY)
- Culture ↔ Style (history → cuisine, tradition → craft, region → ingredients)
- Design ↔ Aesthetics (color theory → presentation, proportion → arrangement, balance → composition)
- Sustainability ↔ Practice (waste reduction → resourcefulness, seasonal → local, repair → maintain)
- Health ↔ Lifestyle (nutrition → cooking, exercise → gardening, wellbeing → home environment)`,

  activityExamples: {
    video: 'Technique demonstration: watch a complete walkthrough of the technique from start to finish. Note the sensory cues the instructor highlights (color changes, texture, sounds). Then attempt the technique yourself, pausing the video at each step. Compare your result to the instructor\'s and identify one area to improve.',
    reading: 'Practical science with ARROW structure: (1) A stunning result that seems magical — "Why does bread rise?", (2) Reverse-engineer the process into its chemical and physical components, (3) Build intuition with kitchen/garden analogies, (4) Formalize with the relevant science (Maillard reaction, photosynthesis, material properties), (5) Show what happens when the science is ignored, (6) Apply by predicting how to modify the result.',
    assignment: 'Hands-on skill practice: Part A — Follow the step-by-step guide to complete the technique with the recommended materials. Part B — Document your process with photos at 3 key stages. Part C — Evaluate your result against the quality criteria provided. Part D — Attempt it again with one modification (different ingredient, different tool, different timing) and compare results.',
    quiz: 'Safety and troubleshooting scenario: "Your bread dough has not risen after 2 hours. Which of these is the most likely cause? What should you check first? What can you still do to save the batch?" Or: "Identify the food safety issue in this kitchen photo."',
    project: 'Complete lifestyle project: Plan and execute a complete project from start to finish (full meal, garden bed, room makeover, DIY build). Include: materials list with budget, step-by-step plan, documentation of process, final result photos, reflection on what worked and what you would change. Share with the community for feedback.',
    discussion: 'Community troubleshooting and tips: "Share a photo of your project attempt. What went well? What surprised you? Ask one specific question about something you want to improve. Then provide constructive feedback on 2 other students\' projects using the chapter\'s quality criteria."',
  },
};

/**
 * Few-Shot Example Snippets for Chapter DNA Templates
 *
 * Gold-standard content examples — one per section role per difficulty level.
 * These are injected into Stage 3 prompts so the AI sees what excellent output
 * looks like before generating its own content.
 *
 * Domain-agnostic topics (prevent bias toward any specific course domain):
 *   Beginner:     "How Maps Work" — universal, story-driven, clear analogies
 *   Intermediate: "Feedback Loops" — cross-disciplinary, counterintuitive results
 *   Advanced:     "The Tragedy of the Commons" — research-grade, first-principles
 *
 * Formulaic sections (SUMMARY, CHECKPOINT, SYNTHESIS) are omitted — their
 * structure is fully determined by format rules and need no creative exemplar.
 *
 * Each snippet: 100-300 tokens of condensed HTML demonstrating tone, structure,
 * and quality for that specific section role.
 */

import type { TemplateSectionRole } from './types';

// ============================================================================
// Beginner Examples — Topic: "How Maps Work"
// ============================================================================

const BEGINNER_HOOK = `<h2>The Library That Never Loses a Book</h2>
<p>Maria runs a small library with 10,000 books. A student asks for a specific book. Maria walks to the shelves, scanning every spine. It takes 23 minutes.</p>
<p>The next day, another request. But this time, Maria remembers: the books are organized by author name. She walks straight to the &ldquo;M&rdquo; section. 45 seconds.</p>
<p><strong>What changed?</strong> The books are the same. The shelves are the same. The only difference is how they are <em>organized</em>.</p>
<p><strong>What if the way you organize information could make everything 30 times faster?</strong></p>`;

const BEGINNER_INTUITION = `<h2>Building Your Mental Model</h2>
<p>Think of it like a phone&apos;s contact list. Without organization, finding &ldquo;Mom&rdquo; means scrolling through hundreds of names. With alphabetical sorting, you jump straight to &ldquo;M.&rdquo;</p>
<table>
<tr><th>Phone Contact List</th><th>Map / Index</th></tr>
<tr><td>Names stored in order</td><td>Data stored by key</td></tr>
<tr><td>Jump to letter &ldquo;M&rdquo;</td><td>Jump to location by label</td></tr>
<tr><td>Instant lookup</td><td>Instant retrieval</td></tr>
</table>
<p><em>Picture this:</em> Imagine a city with no street signs. You&apos;d wander for hours. Now add signs and a grid system &mdash; suddenly you can navigate anywhere in minutes.</p>
<blockquote><strong>Aha:</strong> A map doesn&apos;t change the territory &mdash; it changes how fast you can find things in it.</blockquote>
<p>Prediction: What do you think happens if two streets have the same name?</p>`;

const BEGINNER_WALKTHROUGH = `<h2>Worked Example</h2>
<p>Let&apos;s return to Maria&apos;s library. She decides to build an index card system.</p>
<h3>Iteration 1</h3>
<ol>
<li><strong>Step 1:</strong> Pick a book &mdash; &ldquo;Moby Dick&rdquo; by Melville &rarr; File under &ldquo;M&rdquo;</li>
<li><strong>Step 2:</strong> Write: &ldquo;Melville &rarr; Shelf 7, Position 14&rdquo;</li>
</ol>
<h3>Iteration 2</h3>
<ol>
<li><strong>Step 1:</strong> Pick &ldquo;Pride and Prejudice&rdquo; by Austen &rarr; File under &ldquo;A&rdquo;</li>
<li><strong>Step 2:</strong> Write: &ldquo;Austen &rarr; Shelf 2, Position 3&rdquo;</li>
</ol>
<h3>Iteration 3</h3>
<ol>
<li><strong>Step 1:</strong> Pick &ldquo;1984&rdquo; by Orwell &rarr; File under &ldquo;O&rdquo;</li>
<li><strong>Step 2:</strong> Write: &ldquo;Orwell &rarr; Shelf 12, Position 8&rdquo;</li>
</ol>
<p><strong>The pattern:</strong> Every book gets a <em>key</em> (author name) that points to a <em>location</em> (shelf + position). Looking up a book means finding the key, not scanning every shelf.</p>
<p>Let&apos;s verify: a student asks for Orwell. Maria checks &ldquo;O&rdquo; in her index &rarr; Shelf 12, Position 8. Found in 12 seconds.</p>`;

const BEGINNER_FORMALIZATION = `<h2>Formal Definition</h2>
<p>Remember the pattern you noticed? Every book gets a <em>key</em> that points to a <em>location</em>. That pattern has a name: a <strong>map</strong> (also called a <strong>lookup table</strong> or <strong>dictionary</strong>).</p>
<h3>The Formula</h3>
<p><code>map[key] &rarr; value</code></p>
<p><em>In plain English:</em> Given a key, the map instantly returns the associated value &mdash; no scanning required.</p>
<h3>Mapping to Our Example</h3>
<p>When Maria looked up &ldquo;Orwell&rdquo; and found &ldquo;Shelf 12, Position 8,&rdquo; she was doing: <code>libraryIndex[&ldquo;Orwell&rdquo;] &rarr; {shelf: 12, position: 8}</code>.</p>
<p>Remember our phone contact analogy? The contact list is a map: <code>contacts[&ldquo;Mom&rdquo;] &rarr; &ldquo;555-0123&rdquo;</code>.</p>`;

const BEGINNER_PLAYGROUND = `<h2>Practice Playground</h2>
<h3>Exercise 1: Guided</h3>
<p><strong>Task:</strong> Build a map for a grocery store with 3 items.</p>
<p><em>Template:</em> Step 1: Pick an item (e.g., &ldquo;Bananas&rdquo;). Step 2: Write its location: <code>store[&ldquo;___&rdquo;] &rarr; Aisle ___, Shelf ___</code>. Repeat for 2 more items.</p>
<p><strong>Expected:</strong> 3 key-value pairs like <code>store[&ldquo;Bananas&rdquo;] &rarr; Aisle 3, Shelf 2</code>.</p>
<h3>Exercise 2: Semi-Guided</h3>
<p><strong>Task:</strong> A friend asks for &ldquo;Milk.&rdquo; Using your map, describe the lookup process.</p>
<p><em>Hint:</em> What key do you search for? What does the map return?</p>
<h3>Exercise 3: Independent</h3>
<p><strong>Task:</strong> Your store adds 50 new items. Without a map, how long would finding an item take? With a map? Explain the difference in your own words.</p>`;

const BEGINNER_PITFALLS = `<h2>Common Pitfalls</h2>
<h3>The Duplicate Key Trap</h3>
<p><strong>WRONG:</strong> Two books filed under &ldquo;Smith&rdquo; &mdash; Smith, A. and Smith, B. Maria&apos;s index says &ldquo;Smith &rarr; Shelf 5&rdquo; but which Smith?</p>
<p><em>Why it fails (remember our contact list analogy):</em> If you save two people as &ldquo;Mom,&rdquo; your phone only keeps the last one. A map needs <em>unique</em> keys.</p>
<p><strong>RIGHT:</strong> Use full names as keys: <code>map[&ldquo;Smith, Alice&rdquo;]</code> and <code>map[&ldquo;Smith, Bob&rdquo;]</code>.</p>
<h3>Misconception Buster</h3>
<p>Many people think a map makes data <em>smaller</em>. Actually, it makes data <em>findable</em>. The library still has 10,000 books &mdash; the index just tells you where to look.</p>`;

// ============================================================================
// Intermediate Examples — Topic: "Feedback Loops"
// ============================================================================

const INTERMEDIATE_PROVOCATION = `<h2>The Paradox of Control</h2>
<p>Turn up the thermostat, the room gets warmer. Simple cause and effect.</p>
<p>Now try this: a company increases advertising spending by 50%. Sales go <em>down</em>. They increase spending again. Sales drop further.</p>
<p><strong>Most people would say:</strong> &ldquo;The ads aren&apos;t working.&rdquo; They&apos;re wrong.</p>
<p>The ads triggered a <strong>feedback loop</strong> &mdash; higher visibility attracted competitors, who undercut prices, driving customers away despite greater awareness.</p>
<p><strong>By the end of this chapter, you&apos;ll understand why the most dangerous systems are the ones where your actions change the rules.</strong></p>`;

const INTERMEDIATE_INTUITION_ENGINE = `<h2>Multiple Perspectives</h2>
<h3>Mental Model 1: The Thermostat</h3>
<p>Think of it as a thermostat: it measures temperature, compares to target, and adjusts heating. The <em>output</em> (temperature) feeds back into the <em>input</em> (sensor reading). This is a <strong>negative feedback loop</strong> &mdash; it stabilizes.</p>
<h3>Mental Model 2: The Microphone</h3>
<p>Alternatively, imagine a microphone placed in front of its own speaker. Sound enters the mic, gets amplified, exits the speaker, re-enters the mic &mdash; each cycle louder than the last. This is a <strong>positive feedback loop</strong> &mdash; it amplifies.</p>
<h3>The Unifying Insight</h3>
<p>All these perspectives converge on one key idea: a feedback loop exists whenever a system&apos;s output becomes part of its next input. The <em>sign</em> of the feedback determines whether the system stabilizes or explodes.</p>
<table>
<tr><th>Model</th><th>Strengths</th><th>Limitations</th></tr>
<tr><td>Thermostat</td><td>Intuitive for stabilizing systems</td><td>Doesn&apos;t explain runaway growth</td></tr>
<tr><td>Microphone</td><td>Shows amplification clearly</td><td>Doesn&apos;t show stabilization</td></tr>
</table>`;

const INTERMEDIATE_DERIVATION = `<h2>Deriving the Feedback Equation</h2>
<p>Goal: We want to find a general expression for how a system with feedback evolves over time.</p>
<h3>Step 1</h3>
<p><code>output(t) = gain &times; input(t)</code></p>
<p><em>In English:</em> The system amplifies its input by some factor (the gain).</p>
<h3>Step 2</h3>
<p><code>input(t+1) = external_input + feedback_fraction &times; output(t)</code></p>
<p><em>In English:</em> The next input combines new external input with a fraction of the previous output fed back.</p>
<h3>Intuition Check</h3>
<p>Does this match Mental Model 1 (thermostat)? Yes &mdash; the thermostat reads current temperature (output), compares to setpoint (external input), and adjusts heating (feedback fraction is negative, pulling toward the target).</p>
<h3>Step 3</h3>
<p><code>output(t+1) = gain &times; (external_input + feedback_fraction &times; output(t))</code></p>
<p><em>In English:</em> Substituting Step 2 into Step 1 &mdash; each cycle, the output depends on itself.</p>
<p><strong>Final Result:</strong> When <code>|gain &times; feedback_fraction| &lt; 1</code>, the system converges. When <code>&ge; 1</code>, it diverges.</p>
<p>What this tells us is: the advertising paradox from THE PROVOCATION happened because the effective feedback fraction exceeded 1 &mdash; each ad dollar amplified competitive response more than it boosted sales.</p>`;

const INTERMEDIATE_LABORATORY = `<h2>Laboratory</h2>
<h3>Ex 1: Compute</h3>
<p><strong>Context:</strong> A savings account earns 5% annual interest, compounding yearly.</p>
<p><strong>Task:</strong> If you deposit $1,000, compute the balance after 3 years using the feedback equation.</p>
<h3>Ex 2: Predict-Verify</h3>
<p><strong>Predict:</strong> A population of bacteria doubles every hour. After 10 hours, will there be closer to 1,000 or 1,000,000?</p>
<p><strong>Verify:</strong> Compute <code>2^10</code> and check your prediction.</p>
<h3>Ex 3: Diagnose</h3>
<p><strong>The error:</strong> A student claims a thermostat with gain=2 and feedback_fraction=-0.6 is unstable.</p>
<p><strong>Find it:</strong> Compute <code>|2 &times; -0.6| = 1.2</code>. The student is actually right &mdash; explain why this thermostat would oscillate with increasing amplitude.</p>
<h3>Ex 4: Compare</h3>
<p><strong>Task:</strong> Compare a proportional controller (simple thermostat) vs. a PID controller. When is each better?</p>
<h3>Ex 5: Design</h3>
<p><strong>Task:</strong> Design a feedback system for a social media feed that balances engagement (positive feedback) with content diversity (negative feedback). Define your gain and feedback fractions.</p>`;

const INTERMEDIATE_DEPTH_DIVE = `<h2>Going Deeper</h2>
<h3>Edge Cases</h3>
<p>What happens when the feedback fraction is exactly 1? The system neither converges nor diverges &mdash; it oscillates at constant amplitude, like a frictionless pendulum. In practice, this &ldquo;marginal stability&rdquo; is nearly impossible to maintain.</p>
<p>What happens when there&apos;s a <em>delay</em> in the feedback? A thermostat with a 10-minute lag overshoots the target &mdash; the room gets too hot, then too cold. Delays turn stable negative feedback into oscillating instability.</p>
<h3>Breaking Conditions</h3>
<p>The feedback equation fails when the system is <em>nonlinear</em> &mdash; when gain changes depending on the current output. Real economies, ecosystems, and neural networks all have nonlinear feedback, which is why simple linear models often miss catastrophic tipping points.</p>
<h3>Surprising Connections</h3>
<p>This same feedback pattern appears in audio engineering (compression limiting), neuroscience (excitatory/inhibitory neuron balance), and climate science (ice-albedo feedback). The math is identical; only the domain labels change.</p>`;

// ============================================================================
// Advanced Examples — Topic: "The Tragedy of the Commons"
// ============================================================================

const ADVANCED_OPEN_QUESTION = `<h2>Why Do Rational Individuals Create Irrational Outcomes?</h2>
<p><strong>The puzzle:</strong> Every fisherman in a shared lake acts rationally &mdash; catch as many fish as possible. Yet collectively, they destroy the fishery. Each individual decision is optimal; the aggregate is catastrophic.</p>
<p><strong>Why it matters:</strong> This pattern repeats across climate policy, antibiotic resistance, bandwidth allocation, and open-source maintenance. Hardin formalized it in 1968, yet we still lack a universal solution.</p>
<p><strong>The naive approach:</strong> &ldquo;Just regulate it.&rdquo; But top-down regulation fails when resources cross jurisdictions, information is incomplete, or enforcement costs exceed benefits.</p>
<p><strong>To answer this, we need to think from first principles &mdash; starting with the simplest possible model and adding complexity layer by layer.</strong></p>`;

const ADVANCED_INTUITION = `<h2>Intuition for the Counterintuitive</h2>
<p><strong>The counterintuitive part:</strong> More freedom can produce <em>less</em> total benefit. Each fisherman&apos;s freedom to fish without limit leads to zero fish for everyone.</p>
<p><strong>The analogy:</strong> Think of it like a shared refrigerator in an office. Everyone is rational &mdash; they take what they want. But nobody restocks. Within a week, the fridge is empty and everyone loses. The paradox: each person&apos;s rational choice (take free food) creates an irrational outcome (no food at all).</p>
<p><em>Why this is counterintuitive:</em> Our default assumption is that if every individual optimizes, the group outcome is also optimal. But shared resources break this assumption because one person&apos;s consumption directly reduces another&apos;s supply.</p>
<p>With this intuition, let&apos;s build from first principles.</p>`;

const ADVANCED_FIRST_PRINCIPLES = `<h2>From First Principles</h2>
<h3>Layer 1: The Simplest Case</h3>
<p>Strip everything away: one fisherman, one lake, unlimited fish. The optimal strategy is obvious &mdash; fish as much as you want. No conflict, no tragedy. <strong>New insight:</strong> Scarcity is a prerequisite for the problem.</p>
<h3>Layer 2: Adding Scarcity</h3>
<p>Now the lake has a regeneration rate <code>R</code>. If total catch &le; <code>R</code>, the population is sustainable. The fisherman must now balance current catch against future availability. <strong>New insight:</strong> Time creates a trade-off between present and future value.</p>
<h3>Layer 3: Adding Multiple Agents</h3>
<p>Add a second fisherman. Each controls only their own catch, but both share the regeneration pool. Even if Fisherman A restrains herself, Fisherman B can free-ride on her restraint. <strong>New insight:</strong> Shared resources decouple individual incentives from collective outcomes. This is where the tragedy emerges.</p>
<h3>Layer 4: The Full Formulation</h3>
<p>With <code>N</code> agents, regeneration rate <code>R</code>, and no coordination mechanism, the Nash equilibrium is for each agent to catch <code>R/N + &epsilon;</code> &mdash; slightly more than the sustainable share. The aggregate catch exceeds <code>R</code>, and the resource collapses. The tragedy is a direct consequence of rational individual optimization under shared scarcity.</p>`;

const ADVANCED_ANALYSIS = `<h2>Formal Analysis</h2>
<h3>Complexity</h3>
<p>Finding the Nash equilibrium for N agents is computationally tractable: <code>O(N)</code> for symmetric agents, <code>O(N&sup2;)</code> for heterogeneous agents with pairwise interactions. However, finding the <em>socially optimal</em> allocation is an optimization problem that may be NP-hard under arbitrary constraints.</p>
<h3>Expressiveness</h3>
<p>The commons model captures: fisheries, grazing land, atmospheric carbon, bandwidth, open-source maintainer time. It <em>cannot</em> express situations where consumption creates positive externalities (e.g., network effects), as these are &ldquo;tragedies of the anticommons.&rdquo;</p>
<h3>Limitations</h3>
<p>Hardin&apos;s model assumes anonymous, non-communicating agents. Ostrom (1990) showed that real communities often develop self-governing institutions that avoid the tragedy &mdash; the model fails when social norms, reputation, and repeated interaction exist.</p>
<h3>Comparison</h3>
<table>
<tr><th>Approach</th><th>Strengths</th><th>Weaknesses</th><th>When to Use</th></tr>
<tr><td>Privatization</td><td>Clear incentives</td><td>Not feasible for atmosphere, oceans</td><td>Divisible, excludable resources</td></tr>
<tr><td>Regulation</td><td>Enforceable limits</td><td>Information asymmetry, enforcement cost</td><td>Clear jurisdiction, measurable resource</td></tr>
<tr><td>Community governance (Ostrom)</td><td>Adaptive, local knowledge</td><td>Doesn&apos;t scale to global commons</td><td>Small-to-medium groups, repeated interaction</td></tr>
</table>`;

const ADVANCED_DESIGN_STUDIO = `<h2>Design Studio</h2>
<h3>Challenge 1: Analyze an Existing System</h3>
<p><strong>Context:</strong> Wikipedia is an open-access knowledge commons maintained by volunteers.</p>
<p><strong>Task:</strong> Identify the design decisions that prevent a tragedy of the commons. What mechanisms substitute for regulation?</p>
<p><strong>Deliverable:</strong> A 500-word analysis naming at least 3 governance mechanisms and their trade-offs.</p>
<h3>Challenge 2: Evaluate a Proposal</h3>
<p><strong>Context:</strong> A city proposes congestion pricing to reduce traffic (a commons problem).</p>
<p><strong>Task:</strong> Critique this approach. Who benefits? Who bears disproportionate cost? What unintended feedback loops might emerge?</p>
<h3>Challenge 3: Create a Solution</h3>
<p><strong>Constraints:</strong> Design a resource-sharing protocol for a 50-person co-working space with shared meeting rooms, printers, and coffee. You cannot hire an enforcer.</p>
<p><strong>Deliverable:</strong> A protocol document with rules, incentives, and a monitoring mechanism.</p>
<h3>Challenge 4: Critique Peer Work</h3>
<p><strong>Task:</strong> Review the protocol from Challenge 3 as if you were an Ostrom scholar. Write a constructive critique identifying which of Ostrom&apos;s 8 design principles it satisfies and which it violates.</p>`;

const ADVANCED_FRONTIER = `<h2>The Frontier</h2>
<h3>Open Questions</h3>
<ul>
<li>Can algorithmic mechanism design solve global commons problems (climate, oceans) where traditional governance fails? Active area since Conitzer &amp; Sandholm (~2002).</li>
<li>How do digital commons (open-source software, AI training data) differ from physical commons? The &ldquo;non-rivalrous&rdquo; nature changes the game theory fundamentally.</li>
</ul>
<h3>Key Resources</h3>
<ul>
<li>Ostrom, <em>&ldquo;Governing the Commons&rdquo;</em> (1990) &mdash; Nobel Prize-winning framework for self-governing institutions.</li>
<li>Hardin, <em>&ldquo;The Tragedy of the Commons&rdquo;</em> (1968) &mdash; The foundational paper that defined the problem.</li>
<li>Heller, <em>&ldquo;The Gridlock Economy&rdquo;</em> (2008) &mdash; The anticommons: when too many owners block productive use.</li>
</ul>
<h3>Research Project Idea</h3>
<p><strong>Project:</strong> Analyze an open-source project&apos;s governance model through the lens of Ostrom&apos;s 8 design principles. Compare two projects of different sizes (e.g., a 5-person library vs. Linux kernel).</p>
<p><strong>Skills needed:</strong> Qualitative research methods, game theory basics, familiarity with open-source contribution workflows.</p>
<p><strong>Expected outcome:</strong> A comparative analysis paper identifying which governance mechanisms scale and which break down.</p>`;

// ============================================================================
// Exported Record
// ============================================================================

export const FEW_SHOT_EXAMPLES: Record<
  'beginner' | 'intermediate' | 'advanced',
  Partial<Record<TemplateSectionRole, string>>
> = {
  beginner: {
    HOOK: BEGINNER_HOOK,
    INTUITION: BEGINNER_INTUITION,
    WALKTHROUGH: BEGINNER_WALKTHROUGH,
    FORMALIZATION: BEGINNER_FORMALIZATION,
    PLAYGROUND: BEGINNER_PLAYGROUND,
    PITFALLS: BEGINNER_PITFALLS,
    // SUMMARY and CHECKPOINT omitted — formulaic sections
  },
  intermediate: {
    PROVOCATION: INTERMEDIATE_PROVOCATION,
    INTUITION_ENGINE: INTERMEDIATE_INTUITION_ENGINE,
    DERIVATION: INTERMEDIATE_DERIVATION,
    LABORATORY: INTERMEDIATE_LABORATORY,
    DEPTH_DIVE: INTERMEDIATE_DEPTH_DIVE,
    // SYNTHESIS and CHECKPOINT omitted — formulaic sections
  },
  advanced: {
    OPEN_QUESTION: ADVANCED_OPEN_QUESTION,
    INTUITION: ADVANCED_INTUITION,
    FIRST_PRINCIPLES: ADVANCED_FIRST_PRINCIPLES,
    ANALYSIS: ADVANCED_ANALYSIS,
    DESIGN_STUDIO: ADVANCED_DESIGN_STUDIO,
    FRONTIER: ADVANCED_FRONTIER,
    // SYNTHESIS and CHECKPOINT omitted — formulaic sections
  },
};

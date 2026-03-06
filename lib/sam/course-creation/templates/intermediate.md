# TAXOMIND COURSE TEMPLATE — INTERMEDIATE LEVEL

---

## TEMPLATE METADATA

| Field | Value |
|---|---|
| **Level** | Intermediate (Level 2 of 3) |
| **Example Topic** | Neural Networks: The Mathematics of Learning |
| **Target Audience** | Learners with beginner-level intuition, basic algebra, some coding exposure |
| **Philosophy** | Every equation tells a story. Every algorithm has a visual. Math is not the enemy — bad explanations are. |
| **Estimated Duration** | 20–30 hours |
| **Modules** | 8 core modules |

---

## TAXOMIND INTERMEDIATE-LEVEL DESIGN PRINCIPLES

> An intermediate course is where intuition MEETS formalism. The learner already has the "feel" — now they need to see WHY the math works, not just THAT it works. MIT's 18.06 (Linear Algebra with Gilbert Strang) is the gold standard: every theorem is motivated, visualized, and connected to something real.

### The 5 Pillars of a Taxomind Intermediate Course:

1. **Motivated Mathematics** — No equation appears without the learner first understanding WHY it needs to exist and WHAT problem it solves
2. **Visual Proofs & Geometric Intuition** — Every mathematical operation has a geometric interpretation the learner can "see" in their mind
3. **Build-Then-Explain** — Learners implement first (see the code work), then unpack the math behind it
4. **Failure-Driven Learning** — Show what goes wrong WITHOUT a technique, then introduce the technique as the rescue
5. **Connected Knowledge Graph** — Every concept explicitly connects to (a) the beginner-level intuition, (b) peer concepts in this level, and (c) what it unlocks in the advanced level

---

## FULL COURSE STRUCTURE

---

### MODULE 1: From Intuition to Equations — The Neuron, Formalized

#### Module Objective
The learner transitions from the analogy-based understanding of a neuron to the precise mathematical formulation, and sees that the math is SIMPLER than they feared.

#### Core Intuition Statement
> "Remember the 'party decision' neuron from the beginner course? Every part of that analogy maps directly to a piece of math. The weights, the adding up, the threshold — they're all just one equation."

#### Lesson Flow

**Lesson 1.1: Translating Analogies to Math**
- Recall & Formalize: Beginner analogy → Mathematical form: z = w1x1 + w2x2 + ... + wnxn + b
- Key Visual: [DIAGRAM — Analogy-to-Equation Bridge]
- Vector Notation Introduction: z = w^T x + b

**Lesson 1.2: The Geometry of a Single Neuron**
- Core Geometric Insight: A single neuron defines a hyperplane
- Key Visual: [DIAGRAM — Decision Boundary in 2D]
- Interactive Exploration: What happens when you change weights/bias

**Lesson 1.3: Activation Functions — The Mathematical Story**
- Why We Need Nonlinearity: Without activation, stacking layers is pointless
- The Three Essential Activations: Sigmoid, Tanh, ReLU with geometric interpretations
- Key Visual: [DIAGRAM — Activation Function Comparison Panel]

#### Implementation Exercise
Implement a single neuron from scratch, test on 2D data, visualize decision boundary.

---

### MODULE 2: The Universal Approximation — Why Depth Creates Power

#### Module Objective
The learner understands WHY stacking layers of neurons can approximate any function.

#### Core Intuition Statement
> "A single neuron draws one line. Two neurons can form a 'bump.' Enough bumps, positioned correctly, can trace out ANY shape. This is the Universal Approximation Theorem."

#### Lesson Flow

**Lesson 2.1: From Lines to Regions** — Combining neurons creates complex decision boundaries
**Lesson 2.2: The Bump Construction (Visual Proof)** — Building any function from ReLU bumps
**Lesson 2.3: Why Depth Beats Width** — Composition is exponentially more efficient

#### Implementation Exercise
Visualize the Universal Approximation Theorem with varying network widths and depths.

---

### MODULE 3: Loss Functions — The Art of Measuring Wrong

#### Module Objective
Understanding different loss functions, WHY each exists, and geometric intuition for minimization.

#### Lesson Flow

**Lesson 3.1: Mean Squared Error — The Geometry** — MSE as literal squares on residuals
**Lesson 3.2: Cross-Entropy — The Information Theory Story** — Measuring surprise; brutal to confident wrong answers
**Lesson 3.3: The Loss Landscape** — Mountain range in high dimensions; saddle points vs local minima

#### Implementation Exercise
Visualize loss landscapes, compare MSE vs Cross-Entropy surfaces.

---

### MODULE 4: Backpropagation — The Chain Rule's Greatest Hit

#### Module Objective
Understanding backpropagation as the chain rule applied on computational graphs.

#### Lesson Flow

**Lesson 4.1: The Chain Rule** — The domino chain analogy; derivatives flow backward multiplying at each node
**Lesson 4.2: Computational Graphs** — Every operation as a node; forward values in blue, backward gradients in red
**Lesson 4.3: The Vanishing and Exploding Gradient Problem** — Multiplication through layers; solutions: ReLU, BatchNorm, skip connections

#### Implementation Exercise
Backprop by hand for a tiny network, then verify with code.

---

### MODULE 5: Optimization — Beyond Vanilla Gradient Descent

#### Module Objective
Understanding why plain gradient descent is insufficient and how modern optimizers work.

#### Lesson Flow

**Lesson 5.1: Problems with Vanilla SGD** — Ravines, saddle points, noisy gradients
**Lesson 5.2: Momentum — The Physics of Optimization** — Ball rolling on loss surface
**Lesson 5.3: Adam — The Adaptive Optimizer** — Per-parameter learning rates
**Lesson 5.4: Learning Rate Schedules** — The art of slowing down

#### Implementation Exercise
Optimizer showdown: SGD, Momentum, RMSProp, Adam racing on the same loss surface.

---

### MODULE 6: Regularization — The War Against Overfitting

#### Module Objective
Understanding overfitting geometrically and each regularization technique as a simplicity constraint.

#### Lesson Flow

**Lesson 6.1: Visualizing Overfitting** — The polynomial parable; training vs validation divergence
**Lesson 6.2: L1 and L2 Regularization** — Geometry of constraints; circle (L2) vs diamond (L1)
**Lesson 6.3: Dropout** — Ensemble learning in disguise
**Lesson 6.4: Batch Normalization** — Keeping the signal clean; auto-volume for every layer

#### Implementation Exercise
The Regularization Lab: compare all techniques on signal + noise data.

---

### MODULE 7: Convolutional Neural Networks — Exploiting Spatial Structure

#### Module Objective
Understanding convolutions as learnable feature detectors exploiting spatial locality.

#### Lesson Flow

**Lesson 7.1: The Convolution Operation** — Sliding window of attention
**Lesson 7.2: Building a CNN** — Full architecture walkthrough
**Lesson 7.3: Pooling, Stride, and Padding** — Engineering choices and tradeoffs

#### Implementation Exercise
Build a CNN from scratch with numpy for MNIST.

---

### MODULE 8: Recurrent Networks & Attention — Learning Sequences

#### Module Objective
Understanding RNNs, LSTMs, attention, and the transformer paradigm shift.

#### Lesson Flow

**Lesson 8.1: The Recurrent Idea** — Loops in the network; unrolled through time
**Lesson 8.2: The LSTM** — Learning to remember and forget; notebook analogy
**Lesson 8.3: Attention** — "Where should I look?" — breaking the bottleneck
**Lesson 8.4: Transformers** — Attention is all you need (overview)

#### Implementation Exercise
Sequence modeling comparison: RNN vs LSTM vs self-attention.

---

## INTERMEDIATE TEMPLATE STRUCTURAL RULES

### Content Rules
- **Every equation must be motivated** — "We need this equation because..." appears before any formula
- **Every equation gets a geometric interpretation** — if you can't draw it, don't include it
- **Code follows concept, never leads** — understand first, implement second
- **Derivations shown step-by-step** with English annotations between each step
- **Maximum 3 new equations per lesson**
- **"Why, not just How" boxes** — every technique includes "Why was this invented?"

### Visual Rules
- Every module has 3-5 key diagrams, each serving a distinct purpose
- Geometric visualizations preferred over abstract diagrams
- Parameter space visualizations for every optimization concept
- Before/After comparisons for every technique

### Tone Rules
- "Let's figure this out together" — the learner is a peer
- Mathematical rigor without mathematical pretension
- Celebrate "aha moments" — mark them explicitly
- Reference the beginner course naturally

### Structure Rules
- Each module: 3-5 lessons
- Each lesson follows: Motivation → Visual Intuition → Formal Definition → Geometric Interpretation → Implementation → Connection Map
- Every module has a substantial coding exercise
- Every module ends with a "What Could Go Wrong?" section
- Course builds toward a capstone: Train a CNN on a real dataset from scratch

---

## QUALITY CHECKLIST FOR INTERMEDIATE COURSES

- Can a motivated self-learner with basic math follow every derivation?
- Is every equation accompanied by a geometric/visual interpretation?
- Does the learner understand WHY each technique was invented?
- Are all code exercises substantial enough to build real skill?
- Does each module explicitly connect to beginner-level intuitions?
- Would a second-year ML student say "I wish my course explained it like this"?
- Is the math rigorous but not gratuitously complex?
- Are common failure modes and debugging strategies covered?
- Does the course build toward genuine implementation competency?

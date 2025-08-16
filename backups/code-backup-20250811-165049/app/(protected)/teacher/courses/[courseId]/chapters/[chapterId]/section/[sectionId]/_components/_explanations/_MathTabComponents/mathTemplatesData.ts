import { Template } from "@/components/QuickTemplateComponent";

export const mathTemplates: Template[] = [
  // Algebra Templates
  {
    id: "quadratic-formula",
    title: "Quadratic Formula",
    equation: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    explanation: "The quadratic formula solves equations of the form $ax^2 + bx + c = 0$. The discriminant $b^2 - 4ac$ determines the nature of roots: positive for two real roots, zero for one repeated root, negative for complex roots.",
    category: "algebra",
    difficulty: "intermediate",
    tags: ["quadratic", "roots", "discriminant"],
    description: "Universal formula for solving any quadratic equation"
  },
  {
    id: "slope-intercept",
    title: "Slope-Intercept Form",
    equation: "y = mx + b",
    explanation: "Linear equation where $m$ is the slope (rate of change) and $b$ is the y-intercept (where the line crosses the y-axis). Slope $m = \\frac{\\Delta y}{\\Delta x} = \\frac{y_2 - y_1}{x_2 - x_1}$.",
    category: "algebra",
    difficulty: "beginner",
    tags: ["linear", "slope", "intercept"],
    description: "Standard form of a linear equation"
  },
  {
    id: "distance-formula",
    title: "Distance Formula",
    equation: "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}",
    explanation: "Calculates the straight-line distance between two points $(x_1, y_1)$ and $(x_2, y_2)$ in a coordinate plane. Derived from the Pythagorean theorem.",
    category: "algebra",
    difficulty: "intermediate",
    tags: ["distance", "coordinate", "pythagorean"],
    description: "Distance between two points in 2D space"
  },

  // Calculus Templates
  {
    id: "power-rule",
    title: "Power Rule of Differentiation",
    equation: "\\frac{d}{dx}[x^n] = nx^{n-1}",
    explanation: "The power rule states that the derivative of $x^n$ is $nx^{n-1}$. For example: $\\frac{d}{dx}[x^3] = 3x^2$. This rule applies to any real number $n$.",
    category: "calculus",
    difficulty: "intermediate",
    tags: ["derivative", "power", "differentiation"],
    description: "Basic rule for differentiating polynomial terms"
  },
  {
    id: "chain-rule",
    title: "Chain Rule",
    equation: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)",
    explanation: "The chain rule is used to differentiate composite functions. If $y = f(u)$ and $u = g(x)$, then $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$.",
    category: "calculus",
    difficulty: "advanced",
    tags: ["derivative", "composite", "chain"],
    description: "Rule for differentiating composite functions"
  },
  {
    id: "fundamental-theorem",
    title: "Fundamental Theorem of Calculus",
    equation: "\\int_a^b f'(x) dx = f(b) - f(a)",
    explanation: "Links differentiation and integration. If $F(x)$ is an antiderivative of $f(x)$, then the definite integral equals $F(b) - F(a)$. This connects area under curves to antiderivatives.",
    category: "calculus",
    difficulty: "advanced",
    tags: ["integral", "fundamental", "antiderivative"],
    description: "Core theorem connecting derivatives and integrals"
  },

  // Geometry Templates
  {
    id: "pythagorean-theorem",
    title: "Pythagorean Theorem",
    equation: "a^2 + b^2 = c^2",
    explanation: "In a right triangle, the square of the hypotenuse $c$ equals the sum of squares of the other two sides $a$ and $b$. This fundamental relationship has countless applications in geometry and physics.",
    category: "geometry",
    difficulty: "beginner",
    tags: ["triangle", "right angle", "hypotenuse"],
    description: "Relationship between sides of a right triangle"
  },
  {
    id: "circle-area",
    title: "Area of a Circle",
    equation: "A = \\pi r^2",
    explanation: "The area of a circle with radius $r$ is $\\pi r^2$. Here $\\pi \\approx 3.14159$ is the ratio of circumference to diameter. The area grows quadratically with radius.",
    category: "geometry",
    difficulty: "beginner",
    tags: ["circle", "area", "radius"],
    description: "Formula for the area enclosed by a circle"
  },
  {
    id: "sphere-volume",
    title: "Volume of a Sphere",
    equation: "V = \\frac{4}{3}\\pi r^3",
    explanation: "The volume of a sphere with radius $r$. The factor $\\frac{4}{3}$ comes from integration in spherical coordinates. Volume scales with the cube of radius.",
    category: "geometry",
    difficulty: "intermediate",
    tags: ["sphere", "volume", "3d"],
    description: "Volume of a three-dimensional sphere"
  },

  // Trigonometry Templates
  {
    id: "sine-law",
    title: "Law of Sines",
    equation: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}",
    explanation: "In any triangle, the ratio of a side length to the sine of its opposite angle is constant. Used to solve triangles when given angle-side-angle or angle-angle-side information.",
    category: "trigonometry",
    difficulty: "intermediate",
    tags: ["triangle", "sine", "law"],
    description: "Relationship between sides and angles in any triangle"
  },
  {
    id: "cosine-law",
    title: "Law of Cosines",
    equation: "c^2 = a^2 + b^2 - 2ab\\cos C",
    explanation: "Generalizes the Pythagorean theorem for any triangle. When $C = 90°$, $\\cos C = 0$ and it reduces to $c^2 = a^2 + b^2$. Used for side-side-side or side-angle-side problems.",
    category: "trigonometry",
    difficulty: "intermediate",
    tags: ["triangle", "cosine", "law"],
    description: "Generalization of Pythagorean theorem for any triangle"
  },
  {
    id: "unit-circle",
    title: "Unit Circle Identity",
    equation: "\\sin^2\\theta + \\cos^2\\theta = 1",
    explanation: "Fundamental trigonometric identity derived from the Pythagorean theorem applied to the unit circle. Forms the basis for many other trigonometric identities and relationships.",
    category: "trigonometry",
    difficulty: "beginner",
    tags: ["identity", "unit circle", "pythagorean"],
    description: "Most fundamental trigonometric identity"
  },

  // Statistics Templates
  {
    id: "arithmetic-mean",
    title: "Arithmetic Mean",
    equation: "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i",
    explanation: "The arithmetic mean (average) of $n$ values. Sum all values and divide by the count. Represents the central tendency and is sensitive to outliers.",
    category: "statistics",
    difficulty: "beginner",
    tags: ["mean", "average", "central tendency"],
    description: "Most common measure of central tendency"
  },
  {
    id: "standard-deviation",
    title: "Standard Deviation",
    equation: "\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2}",
    explanation: "Measures the spread of data around the mean $\\mu$. Shows how much values typically deviate from the average. A larger $\\sigma$ indicates more spread in the data.",
    category: "statistics",
    difficulty: "intermediate",
    tags: ["deviation", "spread", "variance"],
    description: "Measure of data spread around the mean"
  },
  {
    id: "normal-distribution",
    title: "Normal Distribution",
    equation: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
    explanation: "The bell curve probability density function with mean $\\mu$ and standard deviation $\\sigma$. Describes many natural phenomena and is central to statistical inference.",
    category: "statistics",
    difficulty: "advanced",
    tags: ["normal", "gaussian", "bell curve"],
    description: "The famous bell curve distribution"
  },

  // Physics Templates
  {
    id: "kinematic-equation",
    title: "Kinematic Equation",
    equation: "v^2 = v_0^2 + 2a(x - x_0)",
    explanation: "Relates final velocity $v$, initial velocity $v_0$, acceleration $a$, and displacement $(x - x_0)$. One of the key equations for motion with constant acceleration.",
    category: "physics",
    difficulty: "intermediate",
    tags: ["kinematics", "motion", "acceleration"],
    description: "Motion equation relating velocity, acceleration, and displacement"
  },
  {
    id: "einstein-mass-energy",
    title: "Mass-Energy Equivalence",
    equation: "E = mc^2",
    explanation: "Einstein's famous equation showing that mass $m$ and energy $E$ are interchangeable, with $c$ being the speed of light. A small amount of mass corresponds to enormous energy.",
    category: "physics",
    difficulty: "intermediate",
    tags: ["relativity", "energy", "mass"],
    description: "Einstein's most famous equation"
  },
  {
    id: "coulombs-law",
    title: "Coulomb's Law",
    equation: "F = k\\frac{q_1 q_2}{r^2}",
    explanation: "The electric force between two charges $q_1$ and $q_2$ separated by distance $r$. The constant $k = \\frac{1}{4\\pi\\epsilon_0} \\approx 8.99 \\times 10^9$ N⋅m²/C². Force follows inverse square law.",
    category: "physics",
    difficulty: "advanced",
    tags: ["electric", "force", "charge"],
    description: "Force between electric charges"
  },

  // Complex Numbers
  {
    id: "euler-formula",
    title: "Euler's Formula",
    equation: "e^{i\\theta} = \\cos\\theta + i\\sin\\theta",
    explanation: "Fundamental formula connecting exponential and trigonometric functions through complex numbers. When $\\theta = \\pi$, gives Euler's identity: $e^{i\\pi} + 1 = 0$.",
    category: "algebra",
    difficulty: "advanced",
    tags: ["complex", "euler", "exponential"],
    description: "Bridge between exponential and trigonometric functions"
  },

  // Logarithms
  {
    id: "change-of-base",
    title: "Change of Base Formula",
    equation: "\\log_b a = \\frac{\\log_c a}{\\log_c b}",
    explanation: "Converts logarithms between different bases. Commonly used with $c = 10$ or $c = e$. Allows calculation of any logarithm using available functions.",
    category: "algebra",
    difficulty: "intermediate",
    tags: ["logarithm", "base", "conversion"],
    description: "Convert logarithms between different bases"
  }
];

export default mathTemplates; 
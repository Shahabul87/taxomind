"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Award,
  BookOpen,
  Target,
  BarChart3,
  Brain,
  Globe,
  Sparkles,
  CheckCircle2,
  Info,
} from "lucide-react";

interface Standard {
  name: string;
  description: string;
  application: string;
  icon: React.ReactNode;
}

interface Engine {
  name: string;
  purpose: string;
  standards: string[];
  icon: React.ReactNode;
}

const standards: Standard[] = [
  {
    name: "Bloom's Taxonomy",
    description: "Six levels of cognitive complexity from Remember to Create",
    application: "Core framework for analyzing thinking skills progression",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    name: "Quality Matters",
    description: "Nationally recognized quality assurance program with 42 standards",
    application: "Ensures course design quality and alignment",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    name: "ADDIE Model",
    description: "Systematic instructional design process",
    application: "Guides course development through 5 phases",
    icon: <Target className="w-5 h-5" />,
  },
  {
    name: "Kirkpatrick Model",
    description: "Four-level training evaluation framework",
    application: "Measures learning effectiveness from reaction to results",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    name: "UNESCO Education 2030",
    description: "Framework for inclusive and equitable quality education",
    application: "Ensures accessibility and lifelong learning",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    name: "ISO 21001:2018",
    description: "International standard for educational organizations",
    application: "Quality management and learner satisfaction",
    icon: <Award className="w-5 h-5" />,
  },
];

const engines: Engine[] = [
  {
    name: "Bloom's Analysis Engine",
    purpose: "Analyzes cognitive complexity and learning progression",
    standards: ["Bloom's Taxonomy", "Webb's DOK"],
    icon: <Brain className="w-5 h-5" />,
  },
  {
    name: "Course Architect Engine",
    purpose: "Optimizes pedagogical design and course structure",
    standards: ["ADDIE Model", "Quality Matters", "Gagné's Nine Events"],
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    name: "Analytics Engine",
    purpose: "Tracks learner behavior and predicts outcomes",
    standards: ["Kirkpatrick Model", "ISO 21001:2018"],
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    name: "Market Intelligence Engine",
    purpose: "Evaluates market positioning and competitive advantage",
    standards: ["ISO 21001:2018", "UNESCO Education 2030"],
    icon: <Globe className="w-5 h-5" />,
  },
];

export function SamStandardsInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          How SAM Evaluates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            SAM&apos;s International Standards Compliance
          </DialogTitle>
          <DialogDescription>
            SAM uses evidence-based methodologies aligned with globally recognized educational standards
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="standards">Standards</TabsTrigger>
            <TabsTrigger value="engines">Engines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Makes SAM Different?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">AI-Powered Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Leverages Claude 3.5 Sonnet for deep content understanding
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Multi-Standard Compliance</p>
                    <p className="text-sm text-muted-foreground">
                      Aligned with 12+ international educational standards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Holistic Assessment</p>
                    <p className="text-sm text-muted-foreground">
                      Evaluates cognitive, pedagogical, engagement, and market dimensions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Evidence-Based Design</p>
                    <p className="text-sm text-muted-foreground">
                      Grounded in decades of educational research
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How SAM Evaluates Your Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Initial Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Parses all content, objectives, and structure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Multi-Dimensional Evaluation</p>
                      <p className="text-sm text-muted-foreground">
                        Analyzes cognitive, pedagogical, and engagement aspects
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Standards Alignment</p>
                      <p className="text-sm text-muted-foreground">
                        Checks compliance with international standards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Recommendation Generation</p>
                      <p className="text-sm text-muted-foreground">
                        Provides actionable improvements with expected outcomes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standards" className="space-y-4">
            {standards.map((standard, index) => (
              <motion.div
                key={standard.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {standard.icon}
                      {standard.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {standard.description}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Application:</span> {standard.application}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="engines" className="space-y-4">
            {engines.map((engine, index) => (
              <motion.div
                key={engine.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {engine.icon}
                      {engine.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {engine.purpose}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {engine.standards.map((standard) => (
                        <Badge key={standard} variant="secondary">
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            SAM&apos;s evaluation methodology ensures validity, reliability, fairness, and transparency
            in all assessments.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SamStandardsBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
    >
      <Shield className="w-4 h-4" />
      12+ International Standards
    </motion.div>
  );
}
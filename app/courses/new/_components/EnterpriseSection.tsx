"use client";

import { motion } from "framer-motion";
import { Building2, Users2, BarChart3, Shield, Zap, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EnterpriseSection() {
  const enterpriseFeatures = [
    {
      icon: Users2,
      title: "Team Management",
      description: "Centralized dashboard to manage learners, track progress, and assign courses"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights into team performance, engagement, and skill development"
    },
    {
      icon: Shield,
      title: "SSO & Security",
      description: "Enterprise-grade security with Single Sign-On and compliance certifications"
    },
    {
      icon: Zap,
      title: "Custom Content",
      description: "Upload proprietary content and create custom learning paths"
    },
    {
      icon: Building2,
      title: "Bulk Licensing",
      description: "Flexible pricing and licenses for teams of any size"
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "Personal success manager and priority technical support"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
              <Building2 className="w-4 h-4 mr-2" />
              For Business
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise Learning Solutions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Empower your workforce with scalable, data-driven learning programs trusted by Fortune 500 companies
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {enterpriseFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl"
              >
                Request Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-300 dark:border-slate-600"
              >
                Talk to Sales
              </Button>
            </div>
          </motion.div>

          {/* Right - Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Get Started Today
                </h3>
                <p className="text-blue-100 mb-6">
                  Fill out the form and our team will reach out within 24 hours
                </p>

                <form className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Work Email"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Company Name"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Team Size"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Get Enterprise Access
                  </Button>
                </form>

                <p className="text-xs text-blue-100 mt-4 text-center">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trusted Companies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">
            Trusted by 500+ Companies Worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["🏢 Microsoft", "🌐 Google", "📦 Amazon", "🔷 IBM", "⚡ Tesla", "🍎 Apple"].map((company, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { CheckCircle2, AlertTriangle, XCircle, Clock, Activity, Server, Database, Globe, Wifi } from "lucide-react";
import Link from "next/link";

const services = [
  { name: "Web Application", status: "operational", latency: "45ms" },
  { name: "API", status: "operational", latency: "32ms" },
  { name: "Database", status: "operational", latency: "12ms" },
  { name: "CDN", status: "operational", latency: "8ms" },
  { name: "Authentication", status: "operational", latency: "28ms" },
  { name: "Payment Processing", status: "operational", latency: "156ms" },
  { name: "Video Streaming", status: "operational", latency: "89ms" },
  { name: "AI Services", status: "operational", latency: "234ms" },
];

const incidents: { date: string; title: string; status: string; description: string }[] = [];

const uptimeData = [
  { day: "Mon", uptime: 100 },
  { day: "Tue", uptime: 100 },
  { day: "Wed", uptime: 99.98 },
  { day: "Thu", uptime: 100 },
  { day: "Fri", uptime: 100 },
  { day: "Sat", uptime: 100 },
  { day: "Sun", uptime: 100 },
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "operational":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "outage":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-slate-400" />;
  }
};

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                allOperational
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}
            >
              {allOperational ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  All Systems Operational
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Some Systems Degraded
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              System Status
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Real-time status and performance metrics for Taxomind services.
            </p>
          </div>
        </div>
      </section>

      {/* Uptime Overview */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                7-Day Uptime
              </h2>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                99.99%
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {uptimeData.map((day) => (
                <div key={day.day} className="text-center">
                  <div
                    className={`h-12 rounded-lg mb-2 ${
                      day.uptime === 100
                        ? "bg-emerald-500"
                        : day.uptime >= 99.9
                        ? "bg-emerald-400"
                        : day.uptime >= 99
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>100% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-400" />
                <span>Partial Outage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-400" />
                <span>Major Outage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Service Status
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {services.map((service, index) => (
                <div
                  key={service.name}
                  className={`flex items-center justify-between p-4 ${
                    index !== services.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={service.status} />
                    <span className="font-medium text-slate-900 dark:text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{service.latency}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        service.status === "operational"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : service.status === "degraded"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Incidents */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Recent Incidents
            </h2>
            {incidents.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No incidents reported in the last 30 days.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{incident.title}</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{incident.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{incident.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Get Status Updates
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Subscribe to receive notifications about system status changes.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

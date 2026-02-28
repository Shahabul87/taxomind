import { Metadata } from "next";
import { Mail, MapPin, Phone, MessageSquare } from "lucide-react";
import { ContactForm } from "./_components/contact-form";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Contact Us | Taxomind",
  description: "Get in touch with the Taxomind team. We're here to help with sales, support, and partnerships.",
};

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Our team typically responds within 24 hours",
    contact: "hello@taxomind.com",
    href: "mailto:hello@taxomind.com",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Available Monday to Friday, 9am-6pm EST",
    contact: "Start a conversation",
    href: "#chat",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Fri from 9am to 6pm EST",
    contact: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
];

const offices = [
  {
    city: "San Francisco",
    address: "100 Market Street, Suite 300",
    country: "United States",
  },
  {
    city: "London",
    address: "30 Finsbury Square",
    country: "United Kingdom",
  },
  {
    city: "Singapore",
    address: "1 Raffles Place, Tower 2",
    country: "Singapore",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <method.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {method.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                  {method.description}
                </p>
                <p className="text-purple-600 dark:text-purple-400 font-medium">
                  {method.contact}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Send us a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Our Offices
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {offices.map((office) => (
              <div
                key={office.city}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {office.city}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {office.address}
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm">
                  {office.country}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Linkedin, Twitter, Globe } from "lucide-react";
import { TeamMemberSVG } from "./svg-illustrations";

const team = [
  {
    name: "John Doe",
    role: "Founder & CEO",
    color: "#8B5CF6",
    bio: "With over 15 years of experience in education and technology, John is passionate about making quality education accessible to everyone.",
    social: {
      linkedin: "https://linkedin.com/in/johndoe",
      twitter: "https://twitter.com/johndoe",
      website: "https://johndoe.com"
    }
  },
  {
    name: "Jane Smith",
    role: "Head of Content",
    color: "#3B82F6",
    bio: "Jane brings her expertise in curriculum development and instructional design to create engaging learning experiences.",
    social: {
      linkedin: "https://linkedin.com/in/janesmith",
      twitter: "https://twitter.com/janesmith"
    }
  },
  {
    name: "Michael Johnson",
    role: "Lead Developer",
    color: "#A855F7",
    bio: "Michael is responsible for building and maintaining our platform, ensuring a seamless learning experience for all users.",
    social: {
      linkedin: "https://linkedin.com/in/michaeljohnson",
      website: "https://michaeljohnson.dev"
    }
  },
  {
    name: "Sarah Williams",
    role: "Community Manager",
    color: "#EC4899",
    bio: "Sarah focuses on building and nurturing our community of learners and instructors, creating a supportive environment for growth.",
    social: {
      linkedin: "https://linkedin.com/in/sarahwilliams",
      twitter: "https://twitter.com/sarahwilliams"
    }
  }
];

export const AboutTeam = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Meet Our Team
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            The People Behind Our Mission
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Our diverse team of educators, technologists, and visionaries is united by a common goal: to transform education for the better.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <div className="relative h-80 mb-6 rounded-xl overflow-hidden">
                <TeamMemberSVG color={member.color} index={index} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="flex gap-3">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-white hover:text-purple-300 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" className="text-white hover:text-purple-300 transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.website && (
                      <a href={member.social.website} target="_blank" rel="noopener noreferrer" className="text-white hover:text-purple-300 transition-colors">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h4>
              <p className="text-purple-600 dark:text-purple-400 mb-3">{member.role}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{member.bio}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Want to join our team? We&apos;re always looking for passionate individuals.
          </p>
          <a 
            href="/careers" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200"
          >
            View Open Positions
          </a>
        </motion.div>
      </div>
    </section>
  );
}; 
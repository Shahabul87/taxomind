"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Bell, 
  HelpCircle,
  Bookmark,
  Award,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

interface MenuItem {
  icon: any;
  label: string;
  link: string;
  description: string;
}
import { LogoutButton } from "@/components/auth/logout-button";
import Image from "next/image";

interface UserMenuProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard";

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close modal when ESC is pressed
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  // Mobile navigation includes sidebar items + user menu items
  const mobileMenuSections = [
    {
      title: "Navigation",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", link: dashboardLink, description: "Overview & analytics" },
        { icon: User, label: "Profile Manager", link: "/profile", description: "Personal information" },
        { icon: Settings, label: "Settings", link: "/settings", description: "Preferences & privacy" },
      ]
    },
    {
      title: "Learning",
      items: [
        { icon: Bookmark, label: "My Courses", link: "/my-courses", description: "Your enrolled courses" },
        { icon: MessageCircle, label: "Study Groups", link: "/groups", description: "Collaborate with others" },
        { icon: Award, label: "Analytics", link: "/analytics", description: "Track your progress" },
      ]
    },
    {
      title: "Tools & Support",
      items: [
        { icon: Bell, label: "Notifications", link: "/settings#notifications", description: "Manage alerts" },
        { icon: CreditCard, label: "Billing", link: "/settings#billing", description: "Plans & payments" },
        { icon: HelpCircle, label: "Help Center", link: "/help", description: "Documentation & guides" },
      ]
    }
  ];

  // Desktop navigation (simplified)
  const desktopMenuSections = [
    {
      title: "Quick Access",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", link: dashboardLink, description: "Overview & analytics" },
        { icon: User, label: "Profile", link: "/profile", description: "Personal information" },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: Settings, label: "Settings", link: "/settings", description: "Preferences & privacy" },
        { icon: Bell, label: "Notifications", link: "/settings#notifications", description: "Manage alerts" },
        { icon: CreditCard, label: "Billing", link: "/settings#billing", description: "Plans & payments" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", link: "/help", description: "Documentation & guides" },
        { icon: MessageCircle, label: "Contact Us", link: "/support", description: "Get assistance" },
      ]
    }
  ];

  const menuSections = isMobile ? mobileMenuSections : desktopMenuSections;

  const getAvatarFallback = (name?: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Get colorful icon styles based on label
  const getIconStyles = (label: string) => {
    const styles: Record<string, { bg: string; hoverBg: string; iconColor: string }> = {
      'Dashboard': {
        bg: 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30',
        hoverBg: 'group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-800/40 dark:group-hover:to-indigo-800/40',
        iconColor: 'text-purple-600 dark:text-purple-400'
      },
      'Profile': {
        bg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
        hoverBg: 'group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40',
        iconColor: 'text-blue-600 dark:text-blue-400'
      },
      'Profile Manager': {
        bg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
        hoverBg: 'group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40',
        iconColor: 'text-blue-600 dark:text-blue-400'
      },
      'Settings': {
        bg: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50',
        hoverBg: 'group-hover:from-slate-200 group-hover:to-gray-200 dark:group-hover:from-slate-700/60 dark:group-hover:to-gray-700/60',
        iconColor: 'text-slate-600 dark:text-slate-400'
      },
      'Notifications': {
        bg: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
        hoverBg: 'group-hover:from-yellow-200 group-hover:to-amber-200 dark:group-hover:from-yellow-800/40 dark:group-hover:to-amber-800/40',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      },
      'Billing': {
        bg: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
        hoverBg: 'group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-800/40 dark:group-hover:to-emerald-800/40',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      'Help Center': {
        bg: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
        hoverBg: 'group-hover:from-orange-200 group-hover:to-red-200 dark:group-hover:from-orange-800/40 dark:group-hover:to-red-800/40',
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      'Contact Us': {
        bg: 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30',
        hoverBg: 'group-hover:from-pink-200 group-hover:to-rose-200 dark:group-hover:from-pink-800/40 dark:group-hover:to-rose-800/40',
        iconColor: 'text-pink-600 dark:text-pink-400'
      },
      'My Courses': {
        bg: 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30',
        hoverBg: 'group-hover:from-violet-200 group-hover:to-purple-200 dark:group-hover:from-violet-800/40 dark:group-hover:to-purple-800/40',
        iconColor: 'text-violet-600 dark:text-violet-400'
      },
      'Study Groups': {
        bg: 'bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30',
        hoverBg: 'group-hover:from-indigo-200 group-hover:to-blue-200 dark:group-hover:from-indigo-800/40 dark:group-hover:to-blue-800/40',
        iconColor: 'text-indigo-600 dark:text-indigo-400'
      },
      'Analytics': {
        bg: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30',
        hoverBg: 'group-hover:from-teal-200 group-hover:to-cyan-200 dark:group-hover:from-teal-800/40 dark:group-hover:to-cyan-800/40',
        iconColor: 'text-teal-600 dark:text-teal-400'
      }
    };

    return styles[label] || {
      bg: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50',
      hoverBg: 'group-hover:from-slate-200 group-hover:to-gray-200 dark:group-hover:from-slate-700/60 dark:group-hover:to-gray-700/60',
      iconColor: 'text-slate-600 dark:text-slate-400'
    };
  };

  // Handle menu item click - closes modal
  const handleMenuItemClick = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative block" ref={menuRef}>
      {/* User Avatar Container */}
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-full p-1"
          aria-label="User menu"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/40 hover:border-purple-400/60 group-hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {getAvatarFallback(user?.name)}
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></div>
          </div>
        </button>
        
        {/* HOVER TOOLTIP - Clean design showing name/email (Desktop only) */}
        <AnimatePresence>
          {isHovered && !isModalOpen && !isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="fixed right-4 top-16 w-64 z-[99999] pointer-events-none"
            >
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500/30 dark:border-purple-400/40 shadow-sm flex-shrink-0">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white font-medium text-sm truncate">{user?.name || "User"}</p>
                    <p className="text-slate-500 dark:text-gray-400 text-xs truncate">{user?.email || "No email"}</p>
                    <span className="inline-flex items-center text-[10px] mt-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      {user?.role === "ADMIN" ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                          Admin
                        </>
                      ) : (
                        <>
                          <Award className="w-2.5 h-2.5 mr-0.5" />
                          Member
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {/* Arrow pointer */}
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-700 transform rotate-45"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CLICK MODAL - Professional and elegant design */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99998]"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
              className={`fixed ${
                isMobile
                  ? "inset-x-4 top-16 bottom-4 w-auto"
                  : "right-4 top-16 w-80"
              } z-[99999]`}
            >
              <div className="relative h-full max-h-[520px] rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Subtle accent line at top */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent dark:via-purple-400/50" />

                {/* Modal Header with User Info */}
                <div className="relative px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                  {/* Close button */}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 dark:border-purple-400/40 shadow-sm flex-shrink-0">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "User"}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {getAvatarFallback(user?.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="text-slate-900 dark:text-white font-semibold text-base truncate">{user?.name || "User"}</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-xs truncate mt-0.5">{user?.email || ""}</p>
                      <div className="flex items-center mt-1.5">
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">
                          {user?.role === "ADMIN" ? (
                            <>
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <Award className="w-3 h-3 mr-1" />
                              Member
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Sections */}
                <div className={`${
                  isMobile ? "flex-1" : "max-h-[340px]"
                } overflow-y-auto py-2`}>
                  {menuSections.map((section, sectionIndex) => (
                    <div key={section.title} className={sectionIndex !== 0 ? "mt-3 pt-3 border-t border-slate-200 dark:border-slate-700" : ""}>
                      <h4 className="px-4 pb-2 text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider font-semibold">
                        {section.title}
                      </h4>

                      <div className="space-y-0.5 px-2">
                        {section.items.map((item) => {
                          const iconStyles = getIconStyles(item.label);
                          return (
                            <Link key={item.label} href={item.link} onClick={handleMenuItemClick}>
                              <motion.div
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center px-3 py-2 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <div className={`w-8 h-8 mr-3 rounded-lg flex items-center justify-center transition-all ${iconStyles.bg} ${iconStyles.hoverBg}`}>
                                  <item.icon className={`w-4 h-4 transition-colors ${iconStyles.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{item.label}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-gray-500 truncate">{item.description}</div>
                                </div>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>

                {/* Logout Section */}
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <LogoutButton className="w-full">
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 mx-2 group"
                    >
                      <div className="w-8 h-8 mr-3 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 group-hover:from-red-200 group-hover:to-pink-200 dark:group-hover:from-red-800/40 dark:group-hover:to-pink-800/40 flex items-center justify-center transition-all">
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Sign Out</div>
                        <div className="text-[10px] text-red-500 dark:text-red-400">End your session</div>
                      </div>
                    </motion.div>
                  </LogoutButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

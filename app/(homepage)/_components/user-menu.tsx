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
  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";

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
        
        {/* HOVER TOOLTIP - Elegant design showing name/email (Desktop only) */}
        <AnimatePresence>
          {isHovered && !isModalOpen && !isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
              className="fixed right-4 top-16 w-72 z-[99999] pointer-events-none"
            >
              <div className="p-4 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/60 shadow-lg flex-shrink-0">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{user?.name || "User"}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-xs truncate">{user?.email || "No email"}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-500/30">
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
                {/* Elegant arrow pointer */}
                <div className="absolute -top-2 right-6 w-4 h-4 bg-white/95 dark:bg-gray-900/95 border-l border-t border-gray-200/60 dark:border-gray-700/60 transform rotate-45"></div>
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
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1] }}
              className={`fixed ${
                isMobile 
                  ? "inset-x-4 top-16 bottom-4 w-auto" 
                  : "right-4 top-16 w-96"
              } rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl overflow-hidden z-[99999]`}
            >
              {/* Modal Header with User Info */}
              <div className="relative p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200/50 dark:border-gray-700/50">
                {/* Close button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-gray-200/80 hover:bg-gray-300 dark:bg-gray-700/80 dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-lg flex-shrink-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl truncate">{user?.name || "User"}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm truncate mt-1">{user?.email || ""}</p>
                    <div className="flex items-center mt-3">
                      <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-500/30 font-medium">
                        {user?.role === "ADMIN" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 mr-1.5" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <Award className="w-3 h-3 mr-1.5" />
                            Premium Member
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Sections */}
              <div className={`${
                isMobile ? "flex-1" : "max-h-[420px]"
              } overflow-y-auto py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm`}>
                {menuSections.map((section, sectionIndex) => (
                  <div key={section.title} className={sectionIndex !== 0 ? "mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50" : ""}>
                    <h4 className="px-6 pb-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                      {section.title}
                    </h4>
                    
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link key={item.label} href={item.link} onClick={handleMenuItemClick}>
                          <motion.div
                            whileHover={{ x: 4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer group mx-3 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
                          >
                            <div className="w-10 h-10 mr-4 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-indigo-500/20 transition-all">
                              <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{item.label}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</div>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout Section */}
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-900/10 dark:to-pink-900/10">
                <LogoutButton className="w-full">
                  <motion.div
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-6 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all cursor-pointer mx-3 hover:bg-red-100/80 dark:hover:bg-red-900/20"
                  >
                    <div className="w-10 h-10 mr-4 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Sign Out</div>
                      <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">End your session</div>
                    </div>
                  </motion.div>
                </LogoutButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
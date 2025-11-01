"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface NavigationBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPage: string;
}

export function NavigationBreadcrumb({ items = [], currentPage }: NavigationBreadcrumbProps) {
  const defaultItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    ...items,
  ];

  return (
    <nav aria-label="Breadcrumb" className="py-4 px-4 md:px-8 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
      <ol className="flex items-center space-x-2 text-sm max-w-7xl mx-auto">
        {defaultItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index === 0 && <Home className="w-4 h-4 mr-2 text-gray-500" />}
            <Link
              href={item.href}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              {item.label}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          </li>
        ))}
        <li className="text-gray-900 dark:text-white font-medium truncate max-w-xs md:max-w-md">
          {currentPage}
        </li>
      </ol>
    </nav>
  );
}

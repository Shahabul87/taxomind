"use client";

import qs from "query-string";
import { LucideIcon } from "lucide-react";
import { 
  usePathname, 
  useRouter, 
  useSearchParams
} from "next/navigation";

import { cn } from "@/lib/utils";

interface CategoryItemProps {
  label: string;
  value?: string;
  icon?: LucideIcon | React.FC<{ className?: string }>;
};

export const CategoryItem = ({label, value, icon: Icon,}: CategoryItemProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategoryId = searchParams?.get("categoryId") || null;
  
  const currentTitle = searchParams?.get("title") || null;

  const isSelected = currentCategoryId === value;

  const onClick = () => {
    const url = qs.stringifyUrl({
      url: pathname || "",
      query: {
        title: currentTitle,
        categoryId: isSelected ? null : value,
      }
    }, { skipNull: true, skipEmptyString: true });
    
    router.push(url);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "py-2 px-3 text-sm bg-gray-700 border border-[#94a3b8] rounded-full flex items-center gap-x-1 hover:border-sky-700 transition",
        isSelected && "border-sky-700  text-sky-800"
      )}
      type="button"
    >
      {Icon && <Icon className="w-5 h-5" />}
      <div className="truncate text-cyan-500 font-semibold tracking-wide">
        {label}
      </div>
    </button>
  )
}
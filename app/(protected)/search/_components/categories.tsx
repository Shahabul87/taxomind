"use client";
import { motion} from "framer-motion";

import { Category } from "@prisma/client";
import {
  MusicIcon,
  CameraIcon,
  FitnessIcon,
  ChartIcon,
  ComputerIcon,
  FilmIcon,
  EngineeringIcon
} from "@/components/icons/custom-icons";
import { LucideIcon } from "lucide-react";

import { CategoryItem } from "./category-item";

interface CategoriesProps {
  items: Category[];
}

const iconMap: Record<Category["name"], React.FC<{ className?: string }>> = {
  "Music": MusicIcon,
  "Photography": CameraIcon,
  "Fitness": FitnessIcon,
  "Accounting": ChartIcon,
  "Computer Science": ComputerIcon,
  "Filming": FilmIcon,
  "Engineering": EngineeringIcon,
};

export const Categories = ({ items, }: CategoriesProps) => {
  
    return (
      <motion.div 
        className="flex items-center gap-x-2  pb-2 "
        animate={{
          translateX: "-50%",
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {items.map((item) => (
          <CategoryItem
            key={item.id}
            label={item.name}
            icon={iconMap[item.name]}
            value={item.id}
          />
        ))}
           {items.map((item) => (
          <CategoryItem
            key={item.id}
            label={item.name}
            icon={iconMap[item.name]}
            value={item.id}
          />
        ))}
      </motion.div>
    )
}
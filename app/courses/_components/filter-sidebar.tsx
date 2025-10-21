"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star,
  DollarSign,
  Clock,
  BarChart3,
  Award,
  Subtitles,
  FileText,
  X
} from "lucide-react";

interface FilterOptions {
  categories: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ label: string; min: number; max: number }>;
  difficulties: Array<{ value: string; label: string; count: number }>;
  durations: Array<{ label: string; min: number; max: number }>;
  ratings: Array<{ value: number; label: string }>;
  features: Array<{ value: string; label: string }>;
}

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedPriceRange: { min: number; max: number } | null;
  setSelectedPriceRange: (range: { min: number; max: number } | null) => void;
  selectedDifficulties: string[];
  setSelectedDifficulties: (difficulties: string[]) => void;
  selectedDuration: { min: number; max: number } | null;
  setSelectedDuration: (duration: { min: number; max: number } | null) => void;
  selectedRating: number | null;
  setSelectedRating: (rating: number | null) => void;
  selectedFeatures: string[];
  setSelectedFeatures: (features: string[]) => void;
  onClearAll: () => void;
}

export function FilterSidebar({
  filterOptions,
  selectedCategories,
  setSelectedCategories,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedDuration,
  setSelectedDuration,
  selectedRating,
  setSelectedRating,
  selectedFeatures,
  setSelectedFeatures,
  onClearAll,
}: FilterSidebarProps) {
  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleDifficultyToggle = (difficulty: string) => {
    if (selectedDifficulties.includes(difficulty)) {
      setSelectedDifficulties(selectedDifficulties.filter((d) => d !== difficulty));
    } else {
      setSelectedDifficulties([...selectedDifficulties, difficulty]);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    setSelectedPriceRange(range);
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            }`}
          />
        ))}
        <span className="ml-1 text-sm">& up</span>
      </div>
    );
  };

  const activeFiltersCount =
    selectedCategories.length +
    (selectedPriceRange ? 1 : 0) +
    selectedDifficulties.length +
    (selectedDuration ? 1 : 0) +
    (selectedRating ? 1 : 0) +
    selectedFeatures.length;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs"
          >
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      <Separator />

      <Accordion type="multiple" defaultValue={["categories", "price", "difficulty"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-medium">Categories</span>
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategories.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {filterOptions.categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground">({category.count})</span>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Price Range</span>
              {selectedPriceRange && (
                <Badge variant="secondary" className="text-xs">Set</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <RadioGroup
                value={selectedPriceRange ? "custom" : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedPriceRange(null);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-prices" />
                  <Label htmlFor="all-prices" className="text-sm cursor-pointer">
                    All Prices
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="text-sm cursor-pointer"
                    onClick={() => handlePriceRangeChange({ min: 0, max: 0 })}>
                    Free
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="text-sm cursor-pointer">
                    Custom Range
                  </Label>
                </div>
              </RadioGroup>

              {selectedPriceRange !== null && (
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between text-sm">
                    <span>${selectedPriceRange.min}</span>
                    <span>${selectedPriceRange.max}</span>
                  </div>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={[selectedPriceRange.min, selectedPriceRange.max]}
                    onValueChange={(values) =>
                      handlePriceRangeChange({ min: values[0], max: values[1] })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Difficulty Level */}
        <AccordionItem value="difficulty">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Difficulty Level</span>
              {selectedDifficulties.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedDifficulties.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {filterOptions.difficulties.map((difficulty) => (
                <div key={difficulty.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={difficulty.value}
                    checked={selectedDifficulties.includes(difficulty.value)}
                    onCheckedChange={() => handleDifficultyToggle(difficulty.value)}
                  />
                  <Label
                    htmlFor={difficulty.value}
                    className="text-sm flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{difficulty.label}</span>
                    <span className="text-xs text-muted-foreground">({difficulty.count})</span>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Duration */}
        <AccordionItem value="duration">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Duration</span>
              {selectedDuration && (
                <Badge variant="secondary" className="text-xs">Set</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={selectedDuration ? JSON.stringify(selectedDuration) : "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedDuration(null);
                } else {
                  const range = JSON.parse(value);
                  setSelectedDuration(range);
                }
              }}
            >
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-durations" />
                  <Label htmlFor="all-durations" className="text-sm cursor-pointer">
                    All Durations
                  </Label>
                </div>
                {filterOptions.durations.map((duration) => (
                  <div key={duration.label} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={JSON.stringify({ min: duration.min, max: duration.max })}
                      id={duration.label}
                    />
                    <Label htmlFor={duration.label} className="text-sm cursor-pointer">
                      {duration.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="font-medium">Rating</span>
              {selectedRating && (
                <Badge variant="secondary" className="text-xs">{selectedRating}+</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={selectedRating?.toString() || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedRating(null);
                } else {
                  setSelectedRating(parseFloat(value));
                }
              }}
            >
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-ratings" />
                  <Label htmlFor="all-ratings" className="text-sm cursor-pointer">
                    All Ratings
                  </Label>
                </div>
                {filterOptions.ratings.map((rating) => (
                  <div key={rating.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.value.toString()} id={`rating-${rating.value}`} />
                    <Label
                      htmlFor={`rating-${rating.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {renderRatingStars(rating.value)}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Features */}
        <AccordionItem value="features">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-medium">Features</span>
              {selectedFeatures.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedFeatures.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificate"
                  checked={selectedFeatures.includes("certificate")}
                  onCheckedChange={() => handleFeatureToggle("certificate")}
                />
                <Label htmlFor="certificate" className="text-sm cursor-pointer flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificate of Completion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subtitles"
                  checked={selectedFeatures.includes("subtitles")}
                  onCheckedChange={() => handleFeatureToggle("subtitles")}
                />
                <Label htmlFor="subtitles" className="text-sm cursor-pointer flex items-center gap-2">
                  <Subtitles className="h-4 w-4" />
                  Subtitles Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exercises"
                  checked={selectedFeatures.includes("exercises")}
                  onCheckedChange={() => handleFeatureToggle("exercises")}
                />
                <Label htmlFor="exercises" className="text-sm cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Practice Exercises
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="downloadable"
                  checked={selectedFeatures.includes("downloadable")}
                  onCheckedChange={() => handleFeatureToggle("downloadable")}
                />
                <Label htmlFor="downloadable" className="text-sm cursor-pointer">
                  Downloadable Resources
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile"
                  checked={selectedFeatures.includes("mobile")}
                  onCheckedChange={() => handleFeatureToggle("mobile")}
                />
                <Label htmlFor="mobile" className="text-sm cursor-pointer">
                  Mobile Access
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
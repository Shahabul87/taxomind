export type FieldSynonyms = Record<string, string[]>;

export const FIELD_SYNONYMS: FieldSynonyms = {
  title: [
    "title",
    "course title",
    "name",
    "course name",
  ],
  description: [
    "description",
    "overview",
    "summary",
    "course overview",
    "details",
  ],
  category: [
    "category",
    "main category",
    "subject area",
    "discipline",
  ],
  subcategory: [
    "subcategory",
    "sub-category",
    "sub category",
  ],
  objective: [
    "objective",
    "learning objective",
    "goal",
    "learning goal",
    "outcome",
  ],
  level: [
    "level",
    "difficulty",
    "proficiency",
  ],
  duration: [
    "duration",
    "length",
    "time",
  ],
  price: [
    "price",
    "cost",
    "fee",
  ]
};


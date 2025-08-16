export interface ExplanationItem {
  id: string;
  heading: string | null;
  code?: string | null;
  explanation: string | null;
  imageUrl?: string | null;
  equation?: string | null;
  mode?: "equation" | "visual";
  type: "math" | "code";
}

export interface ExplanationsListProps {
  items: ExplanationItem[];
  onCreateClick?: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  type: "math" | "code";
}

export interface CodeBlock {
  id: number;
  code: string;
  language: string;
}

export interface ExplanationBlock {
  id: number;
  explanation: string;
} 
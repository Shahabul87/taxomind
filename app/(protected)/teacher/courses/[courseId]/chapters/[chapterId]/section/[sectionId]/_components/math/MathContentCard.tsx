'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { formatDistanceToNow } from 'date-fns';

interface MathExplanation {
  id: string;
  title: string;
  latexEquation?: string | null;
  imageUrl?: string | null;
  explanation: string;
  position: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface MathContentCardProps {
  item: MathExplanation;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const MathContentCard = ({ item, onEdit, onDelete, isDeleting }: MathContentCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-col xs:flex-row xs:items-center justify-between pb-3 gap-3">
        <CardTitle className="text-base sm:text-lg font-semibold break-words">{item.title}</CardTitle>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(item.id)}
            className="h-8 w-8"
            disabled={isDeleting}
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
            disabled={isDeleting}
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Equation or Image */}
          <div className="flex items-center justify-center bg-muted/30 rounded-lg border p-6 min-h-[200px]">
            {item.latexEquation && item.latexEquation.trim() ? (
              <div className="w-full">
                <MathRenderer
                  equation={item.latexEquation}
                  mode="block"
                  size="medium"
                  theme="auto"
                  className="w-full"
                />
              </div>
            ) : item.imageUrl && item.imageUrl.trim() ? (
              <div className="relative w-full h-full min-h-[200px]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-contain rounded"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-sm">No equation or image</p>
              </div>
            )}
          </div>

          {/* Right: Explanation */}
          <div className="bg-muted/30 rounded-lg border p-6">
            <div
              className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto max-h-[200px]"
              dangerouslySetInnerHTML={{ __html: item.explanation }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 text-xs text-muted-foreground flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1">
          {item.createdAt && (
            <span>
              Created {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          )}
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <span>
              Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

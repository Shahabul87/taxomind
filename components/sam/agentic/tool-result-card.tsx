'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AgenticToolResult } from '@/lib/sam/agentic-chat/types';

interface ToolResultCardProps {
  results: AgenticToolResult[];
}

export function ToolResultCard({ results }: ToolResultCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (results.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {results.map((result, index) => {
        const isExpanded = expandedIndex === index;
        const isSuccess = result.status === 'success';

        return (
          <Card key={`${result.toolId}-${index}`} className="border-dashed">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-muted-foreground" />
                  <span>{result.toolName}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {result.category}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  {isSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  )}
                  {result.data && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {isExpanded && result.data && (
              <CardContent className="py-2 px-3 pt-0">
                <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
                {result.reasoning && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    {result.reasoning}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {result.durationMs}ms
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

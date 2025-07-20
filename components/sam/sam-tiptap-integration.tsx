"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useSamAITutor } from '@/app/(protected)/teacher/_components/sam-ai-tutor-provider';
import { Bot, Wand2, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SAMTipTapIntegrationProps {
  editor: Editor | null;
  onSuggestion?: (suggestion: string) => void;
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    formType?: string;
  };
}

interface SAMSuggestion {
  id: string;
  type: 'content' | 'structure' | 'enhancement' | 'correction';
  text: string;
  confidence: number;
  position?: { from: number; to: number };
}

export function SAMTipTapIntegration({ 
  editor, 
  onSuggestion, 
  context 
}: SAMTipTapIntegrationProps) {
  const { 
    generateAdaptiveContent, 
    trackInteraction, 
    awardPoints,
    learningContext,
    tutorPersonality 
  } = useSamAITutor();
  
  const [isActive, setIsActive] = useState(false);
  const [suggestions, setSuggestions] = useState<SAMSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const integrationRef = useRef<HTMLDivElement>(null);
  
  // Track editor selection changes
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);
      
      // Get cursor position for floating UI
      const { coords } = editor.view.coordsAtPos(from);
      setCursorPosition({ x: coords.left, y: coords.top });
    };

    const handleUpdate = () => {
      // Analyze content for suggestions
      analyzecontent();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, analyzecontent]);

  // Analyze content for SAM suggestions
  const analyzecontent = useCallback(async () => {
    if (!editor || !isActive) return;

    const content = editor.getHTML();
    const textContent = editor.getText();
    
    // Skip if content is too short
    if (textContent.length < 10) return;

    try {
      // Generate contextual suggestions based on content
      const newSuggestions: SAMSuggestion[] = [];
      
      // Check for common improvement opportunities
      if (textContent.length > 50 && !textContent.includes('.')) {
        newSuggestions.push({
          id: 'punctuation',
          type: 'correction',
          text: 'Consider adding punctuation to improve readability',
          confidence: 0.8,
        });
      }
      
      // Check for passive voice (simplified detection)
      if (textContent.includes('was ') || textContent.includes('were ')) {
        newSuggestions.push({
          id: 'active-voice',
          type: 'enhancement',
          text: 'Consider using active voice for more engaging content',
          confidence: 0.6,
        });
      }
      
      // Check for learning objectives structure
      if (context?.formType === 'learning-outcome' && !textContent.toLowerCase().includes('students will')) {
        newSuggestions.push({
          id: 'learning-objective',
          type: 'structure',
          text: 'Learning outcomes typically start with "Students will be able to..."',
          confidence: 0.9,
        });
      }
      
      // Content length suggestions
      if (textContent.length < 50 && context?.formType === 'description') {
        newSuggestions.push({
          id: 'content-length',
          type: 'content',
          text: 'Consider expanding this description to provide more detail',
          confidence: 0.7,
        });
      }

      setSuggestions(newSuggestions);
      
      // Track the analysis interaction
      trackInteraction('content_analyzed', {
        contentLength: textContent.length,
        suggestionsGenerated: newSuggestions.length,
        formType: context?.formType,
      });
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  }, [editor, isActive, context, trackInteraction]);

  // Generate AI content suggestions
  const generateContentSuggestion = useCallback(async (type: 'expand' | 'improve' | 'rephrase') => {
    if (!editor) return;

    setIsGenerating(true);
    
    try {
      const currentContent = selectedText || editor.getText();
      const prompt = getPromptForType(type, currentContent, context);
      
      const suggestion = await generateAdaptiveContent(
        prompt,
        'explanation'
      );
      
      if (suggestion) {
        const newSuggestion: SAMSuggestion = {
          id: `ai-${type}-${Date.now()}`,
          type: 'content',
          text: suggestion,
          confidence: 0.85,
        };
        
        setSuggestions(prev => [newSuggestion, ...prev]);
        onSuggestion?.(suggestion);
        
        // Award points for using AI assistance
        await awardPoints(5, `Used SAM AI to ${type} content`);
        
        trackInteraction('ai_content_generated', {
          type,
          originalLength: currentContent.length,
          suggestionLength: suggestion.length,
          formType: context?.formType,
        });
      }
    } catch (error) {
      console.error('Error generating content suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [editor, selectedText, context, generateAdaptiveContent, onSuggestion, awardPoints, trackInteraction, getPromptForType]);

  // Apply suggestion to editor
  const applySuggestion = useCallback((suggestion: SAMSuggestion) => {
    if (!editor) return;

    if (suggestion.type === 'content') {
      if (selectedText) {
        // Replace selected text
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(suggestion.text).run();
      } else {
        // Insert at cursor
        editor.chain().focus().insertContent(suggestion.text).run();
      }
    } else {
      // For other types, just insert the suggestion as a comment or note
      editor.chain().focus().insertContent(`<!-- SAM Suggestion: ${suggestion.text} -->`).run();
    }

    // Award points for applying suggestions
    awardPoints(3, 'Applied SAM suggestion');
    
    trackInteraction('suggestion_applied', {
      suggestionType: suggestion.type,
      suggestionId: suggestion.id,
      formType: context?.formType,
    });

    // Remove the applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [editor, selectedText, awardPoints, trackInteraction, context]);

  // Get appropriate prompt for content generation
  const getPromptForType = useCallback((type: string, content: string, context?: any) => {
    const baseContext = `
      Form Type: ${context?.formType || 'general'}
      Course Context: ${learningContext.currentCourse?.title || 'Unknown'}
      Chapter Context: ${learningContext.currentChapter?.title || 'Unknown'}
      Current Content: "${content}"
    `;

    switch (type) {
      case 'expand':
        return `${baseContext}\n\nPlease expand this content with more detail and examples.`;
      case 'improve':
        return `${baseContext}\n\nPlease improve this content for clarity and engagement.`;
      case 'rephrase':
        return `${baseContext}\n\nPlease rephrase this content in a different way while maintaining the meaning.`;
      default:
        return `${baseContext}\n\nPlease provide helpful suggestions for this content.`;
    }
  }, [learningContext]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    trackInteraction('suggestion_dismissed', {
      suggestionId,
      formType: context?.formType,
    });
  }, [trackInteraction, context]);

  if (!editor) return null;

  return (
    <div ref={integrationRef} className="relative">
      {/* SAM Control Panel */}
      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsActive(!isActive)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors",
            isActive 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          )}
        >
          <Bot className="h-4 w-4" />
          SAM Assistant
        </button>
        
        {isActive && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <button
              onClick={() => generateContentSuggestion('expand')}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
            >
              <Wand2 className="h-3 w-3" />
              Expand
            </button>
            
            <button
              onClick={() => generateContentSuggestion('improve')}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              Improve
            </button>
            
            <button
              onClick={() => generateContentSuggestion('rephrase')}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Rephrase
            </button>
            
            {selectedText && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
&quot;{selectedText.slice(0, 30)}{selectedText.length > 30 ? '...' : ''}&quot; selected
              </span>
            )}
            
            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Generating...
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Suggestions Panel */}
      {isActive && suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            <MessageCircle className="h-4 w-4" />
            SAM Suggestions ({suggestions.length})
          </div>
          
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      suggestion.type === 'content' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                      suggestion.type === 'structure' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                      suggestion.type === 'enhancement' && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                      suggestion.type === 'correction' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    )}>
                      {suggestion.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion.text}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  {suggestion.type === 'content' && (
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => dismissSuggestion(suggestion.id)}
                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SAMTipTapIntegration;
'use client';

import { useEffect, useRef, useState } from 'react';
import { useCourseCreation, detectBloomsLevelFromText, getBloomsLevelColor, getBloomsLevelEmoji } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { BloomsLevel } from '@prisma/client';
import { Sparkles } from 'lucide-react';

interface SAMAwareInputProps {
  fieldName: string;
  fieldType: 'title' | 'description' | 'objective' | 'chapter' | 'section' | 'assessment';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  showBloomsIndicator?: boolean;
}

export function SAMAwareInput({
  fieldName,
  fieldType,
  value,
  onChange,
  placeholder,
  className = '',
  multiline = false,
  rows = 3,
  disabled = false,
  showBloomsIndicator = true,
}: SAMAwareInputProps) {
  const { setCurrentField, updateCourseData } = useCourseCreation();
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Notify SAM when this field is focused
  const handleFocus = () => {
    setIsFocused(true);
    const bloomsLevel = detectBloomsLevelFromText(value);

    setCurrentField({
      fieldName,
      fieldValue: value,
      fieldType,
      bloomsLevel: bloomsLevel || undefined,
      cursorPosition: (inputRef.current as HTMLTextAreaElement)?.selectionStart,
    });
  };

  // Clear current field when blurred
  const handleBlur = () => {
    setIsFocused(false);
    // Don't clear immediately to allow interactions with suggestions
    setTimeout(() => {
      if (!document.activeElement?.closest('.sam-contextual-panel')) {
        // setCurrentField(null); // Keep field context even when blurred for better UX
      }
    }, 200);
  };

  // Update course data and field context when value changes
  useEffect(() => {
    const bloomsLevel = detectBloomsLevelFromText(value);

    // Update course data
    updateCourseData({ [fieldName]: value });

    // Update field context if this field is currently focused
    if (isFocused) {
      setCurrentField({
        fieldName,
        fieldValue: value,
        fieldType,
        bloomsLevel: bloomsLevel || undefined,
      });
    }
  }, [value, fieldName, fieldType, isFocused, updateCourseData, setCurrentField]);

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => onChange(e.target.value),
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    disabled,
    className: `${className} ${isFocused ? 'ring-2 ring-blue-500' : ''}`,
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          {...commonProps}
          rows={rows}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          {...commonProps}
        />
      )}

      {/* Bloom's level indicator (top-right corner) */}
      {showBloomsIndicator && value.length > 10 && (
        <BloomsLevelIndicator value={value} isFocused={isFocused} />
      )}

      {/* SAM hint indicator (shows when field is focused) */}
      {isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>SAM is analyzing this field...</span>
        </div>
      )}
    </div>
  );
}

function BloomsLevelIndicator({ value, isFocused }: { value: string; isFocused: boolean }) {
  const bloomsLevel = detectBloomsLevelFromText(value);

  if (!bloomsLevel) return null;

  const colorClasses = getBloomsLevelColor(bloomsLevel);
  const emoji = getBloomsLevelEmoji(bloomsLevel);

  return (
    <div
      className={`absolute right-2 top-2 flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all ${colorClasses} ${
        isFocused ? 'scale-110' : ''
      }`}
    >
      <span>{emoji}</span>
      <span>{bloomsLevel}</span>
    </div>
  );
}

// Specialized component for learning objectives (list of objectives)
interface SAMAwareLearningObjectivesProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
  className?: string;
}

export function SAMAwareLearningObjectives({
  objectives,
  onChange,
  className = '',
}: SAMAwareLearningObjectivesProps) {
  const [newObjective, setNewObjective] = useState('');

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      onChange([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    onChange(objectives.filter((_, i) => i !== index));
  };

  const handleUpdateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Existing objectives */}
      {objectives.map((objective, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="text-sm font-medium text-gray-500 mt-3">{index + 1}.</span>
          <div className="flex-1">
            <SAMAwareInput
              fieldName={`objective-${index}`}
              fieldType="objective"
              value={objective}
              onChange={(value) => handleUpdateObjective(index, value)}
              placeholder="Students will be able to..."
              multiline
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveObjective(index)}
            className="mt-2 text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add new objective */}
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-500 mt-3">{objectives.length + 1}.</span>
        <div className="flex-1">
          <SAMAwareInput
            fieldName="new-objective"
            fieldType="objective"
            value={newObjective}
            onChange={setNewObjective}
            placeholder="Add a learning objective..."
            multiline
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAddObjective}
          disabled={!newObjective.trim()}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// Example usage in a form:
/*
import { SAMAwareInput, SAMAwareLearningObjectives } from '@/components/course-creation/sam-aware-input';

export function CourseForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Course Title</label>
        <SAMAwareInput
          fieldName="title"
          fieldType="title"
          value={title}
          onChange={setTitle}
          placeholder="Enter course title..."
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Course Description</label>
        <SAMAwareInput
          fieldName="description"
          fieldType="description"
          value={description}
          onChange={setDescription}
          placeholder="Describe what students will learn..."
          multiline
          rows={6}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Learning Objectives</label>
        <SAMAwareLearningObjectives
          objectives={objectives}
          onChange={setObjectives}
        />
      </div>
    </div>
  );
}
*/

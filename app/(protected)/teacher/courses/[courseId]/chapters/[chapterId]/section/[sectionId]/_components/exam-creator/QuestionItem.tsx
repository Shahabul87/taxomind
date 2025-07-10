"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Edit2, Trash2, Save, X, Plus } from "lucide-react";
import { Question, QuestionType, DifficultyLevel } from "./types";

interface QuestionItemProps {
  question: Question;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onCancelEdit: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function QuestionItem({
  question,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: QuestionItemProps) {
  return (
    <div
      className={cn(
        "relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-all duration-200 hover:shadow-md",
        isEditing && "ring-2 ring-blue-500 dark:ring-blue-400"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              className="flex items-center gap-2"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600 dark:hover:text-gray-300" />
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {index + 1}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  question.difficulty === "easy"
                    ? "default"
                    : question.difficulty === "medium"
                    ? "secondary"
                    : "destructive"
                }
              >
                {question.difficulty}
              </Badge>
              <Badge variant="outline">{question.type.replace("-", " ")}</Badge>
              {question.bloomsLevel && (
                <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                  {question.bloomsLevel}
                </Badge>
              )}
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {question.points} pts
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <QuestionEditForm
            question={question}
            onUpdate={onUpdate}
            onCancel={onCancelEdit}
            onDelete={onDelete}
          />
        ) : (
          <QuestionDisplay question={question} onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

interface QuestionEditFormProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function QuestionEditForm({ question, onUpdate, onCancel, onDelete }: QuestionEditFormProps) {
  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
      {/* Question Text */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Question
        </label>
        <Textarea
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="min-h-[80px]"
          placeholder="Enter your question..."
        />
      </div>

      {/* Question Properties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Type
          </label>
          <Select
            value={question.type}
            onValueChange={(value) => onUpdate({ type: value as QuestionType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="true-false">True/False</SelectItem>
              <SelectItem value="short-answer">Short Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Difficulty
          </label>
          <Select
            value={question.difficulty}
            onValueChange={(value) => onUpdate({ difficulty: value as DifficultyLevel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Points
          </label>
          <Input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      {/* Options for Multiple Choice and True/False */}
      {(question.type === "multiple-choice" || question.type === "true-false") && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Options
          </label>
          <div className="space-y-2">
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === option}
                    onChange={() => onUpdate({ correctAnswer: option })}
                    className="text-green-600"
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                    onUpdate({ options: newOptions });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {question.type === "multiple-choice" && (question.options?.length || 0) < 6 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const newOptions = [...(question.options || []), ""];
                  onUpdate({ options: newOptions });
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Correct Answer for Short Answer */}
      {question.type === "short-answer" && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Correct Answer
          </label>
          <Input
            value={question.correctAnswer}
            onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
            placeholder="Enter the correct answer..."
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Explanation (Optional)
        </label>
        <Textarea
          value={question.explanation || ""}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[60px]"
          placeholder="Explain why this is the correct answer..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <Button
          type="button"
          size="sm"
          onClick={onCancel}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Question
        </Button>
      </div>
    </div>
  );
}

interface QuestionDisplayProps {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
}

function QuestionDisplay({ question, onEdit, onDelete }: QuestionDisplayProps) {
  return (
    <div className="space-y-3">
      {/* Question Text */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-800 dark:text-gray-200 font-medium text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options Display */}
      {question.options && question.options.length > 0 && (
        <div className="ml-4 space-y-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = option === question.correctAnswer;
            const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D...

            return (
              <div
                key={optionIndex}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-md transition-colors",
                  isCorrect
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    isCorrect
                      ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {optionLetter}
                </div>
                <span
                  className={cn(
                    "text-sm flex-1",
                    isCorrect
                      ? "text-green-700 dark:text-green-300 font-medium"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {option}
                </span>
                {isCorrect && (
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Short Answer Display */}
      {question.type === "short-answer" && (
        <div className="ml-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Correct Answer:
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
              {question.correctAnswer}
            </span>
          </div>
        </div>
      )}

      {/* Explanation Display */}
      {question.explanation && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-0.5">
              💡
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Explanation
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Type: {question.type.replace("-", " ")}</span>
          <span>•</span>
          <span>Difficulty: {question.difficulty}</span>
          <span>•</span>
          <span>
            {question.points} point{question.points !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
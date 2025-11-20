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
      <div className="p-3 sm:p-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 cursor-grab hover:text-gray-600 dark:hover:text-gray-300" />
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {index + 1}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <Badge
                variant={
                  question.difficulty === "easy"
                    ? "default"
                    : question.difficulty === "medium"
                    ? "secondary"
                    : "destructive"
                }
                className="text-[10px] sm:text-xs"
              >
                {question.difficulty}
              </Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs">{question.type.replace("-", " ")}</Badge>
              {question.bloomsLevel && (
                <Badge variant="outline" className="text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs">
                  {question.bloomsLevel}
                </Badge>
              )}
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] sm:text-xs">
                {question.points} pts
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
      {/* Question Text */}
      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
          Question
        </label>
        <Textarea
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="min-h-[70px] sm:min-h-[80px] text-xs sm:text-sm"
          placeholder="Enter your question..."
        />
      </div>

      {/* Question Properties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
            Type
          </label>
          <Select
            value={question.type}
            onValueChange={(value) => onUpdate({ type: value as QuestionType })}
          >
            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice" className="text-xs sm:text-sm">Multiple Choice</SelectItem>
              <SelectItem value="true-false" className="text-xs sm:text-sm">True/False</SelectItem>
              <SelectItem value="short-answer" className="text-xs sm:text-sm">Short Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
            Difficulty
          </label>
          <Select
            value={question.difficulty}
            onValueChange={(value) => onUpdate({ difficulty: value as DifficultyLevel })}
          >
            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy" className="text-xs sm:text-sm">Easy</SelectItem>
              <SelectItem value="medium" className="text-xs sm:text-sm">Medium</SelectItem>
              <SelectItem value="hard" className="text-xs sm:text-sm">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
            Points
          </label>
          <Input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Options for Multiple Choice and True/False */}
      {(question.type === "multiple-choice" || question.type === "true-false") && (
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
            Options
          </label>
          <div className="space-y-2">
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === option}
                    onChange={() => onUpdate({ correctAnswer: option })}
                    className="text-green-600 flex-shrink-0"
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="h-9 sm:h-10 text-xs sm:text-sm min-w-0"
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
                  className="text-red-600 hover:text-red-700 h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Add Option
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Correct Answer for Short Answer */}
      {question.type === "short-answer" && (
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
            Correct Answer
          </label>
          <Input
            value={question.correctAnswer}
            onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
            placeholder="Enter the correct answer..."
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
          Explanation (Optional)
        </label>
        <Textarea
          value={question.explanation || ""}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[50px] sm:min-h-[60px] text-xs sm:text-sm"
          placeholder="Explain why this is the correct answer..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <Button
          type="button"
          size="sm"
          onClick={onCancel}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full xs:w-auto"
        >
          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Save Changes
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full xs:w-auto">
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full xs:w-auto xs:ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
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
    <div className="space-y-2.5 sm:space-y-3">
      {/* Question Text */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-800 dark:text-gray-200 font-medium text-sm sm:text-base leading-relaxed break-words">
          {question.question}
        </p>
      </div>

      {/* Options Display */}
      {question.options && question.options.length > 0 && (
        <div className="ml-2 sm:ml-4 space-y-1.5 sm:space-y-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = option === question.correctAnswer;
            const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D...

            return (
              <div
                key={optionIndex}
                className={cn(
                  "flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-md transition-colors",
                  isCorrect
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium",
                    isCorrect
                      ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {optionLetter}
                </div>
                <span
                  className={cn(
                    "text-xs sm:text-sm flex-1 break-words",
                    isCorrect
                      ? "text-green-700 dark:text-green-300 font-medium"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {option}
                </span>
                {isCorrect && (
                  <div className="flex-shrink-0">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
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
        <div className="ml-2 sm:ml-4 p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1.5 xs:gap-2">
            <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              Correct Answer:
            </span>
            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded break-all">
              {question.correctAnswer}
            </span>
          </div>
        </div>
      )}

      {/* Explanation Display */}
      {question.explanation && (
        <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mt-0.5 flex-shrink-0">
              💡
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-0.5 sm:mb-1">
                Explanation
              </div>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 leading-relaxed break-words">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span>Type: {question.type.replace("-", " ")}</span>
          <span className="hidden xs:inline">•</span>
          <span>Difficulty: {question.difficulty}</span>
          <span className="hidden xs:inline">•</span>
          <span>
            {question.points} point{question.points !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
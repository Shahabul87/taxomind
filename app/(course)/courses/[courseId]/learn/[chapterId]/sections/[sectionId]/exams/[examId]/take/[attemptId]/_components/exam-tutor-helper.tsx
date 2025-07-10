"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  Brain, 
  X, 
  Send,
  Lightbulb,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ExamTutorHelperProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  examId: string;
  question: {
    id: string;
    question: string;
    questionType: string;
    difficulty?: string;
    bloomsLevel?: string;
    points: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ExamTutorHelper = ({
  courseId,
  chapterId,
  sectionId,
  examId,
  question,
  isOpen,
  onClose
}: ExamTutorHelperProps) => {
  const [tutorResponse, setTutorResponse] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [helpType, setHelpType] = useState<"hint" | "concept" | "custom">("hint");

  const getHelp = async (type: "hint" | "concept" | "custom", customQuery?: string) => {
    setIsLoading(true);
    setHelpType(type);

    try {
      let userMessage = "";
      
      switch (type) {
        case "hint":
          userMessage = `I'm working on this exam question but I'm stuck. Can you give me a hint to guide my thinking without giving away the answer? 

Question: "${question.question}"
Difficulty: ${question.difficulty}
Cognitive Level: ${question.bloomsLevel}

Please provide a hint that helps me think through the problem step by step.`;
          break;
          
        case "concept":
          userMessage = `I don't understand the underlying concepts for this exam question. Can you explain the key concepts I need to know?

Question: "${question.question}"
Difficulty: ${question.difficulty}
Cognitive Level: ${question.bloomsLevel}

Please explain the fundamental concepts without solving the question for me.`;
          break;
          
        case "custom":
          userMessage = customQuery || "Can you help me with this exam question?";
          break;
      }

      const response = await fetch('/api/ai-tutor/context-aware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: userMessage
            }
          ],
          courseId,
          chapterId,
          sectionId,
          questionContext: {
            examId,
            questionId: question.id,
            difficulty: question.difficulty || "medium",
            bloomsLevel: question.bloomsLevel || "understand"
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setTutorResponse(data.content);
      
      toast.success("AI tutor provided contextual help!");

    } catch (error) {
      console.error('Error getting tutor help:', error);
      toast.error('Failed to get help from AI tutor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    getHelp("custom", customQuestion);
    setCustomQuestion("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Tutor Help
                </CardTitle>
                <CardDescription>
                  Get contextual help without compromising your exam
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Context */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{question.questionType}</Badge>
                <Badge variant="secondary">{question.difficulty}</Badge>
                <Badge variant="outline">{question.bloomsLevel}</Badge>
                <Badge className="bg-blue-100 text-blue-700">
                  {question.points} pts
                </Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {question.question}
              </p>
            </div>

            {/* Help Options */}
            {!tutorResponse && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  How can I help you with this question?
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => getHelp("hint")}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div className="text-left">
                        <p className="font-medium">Get a Hint</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Receive guidance to help you think through the problem
                        </p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => getHelp("concept")}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div className="text-left">
                        <p className="font-medium">Explain Concepts</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Understand the underlying concepts and principles
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Custom Question */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ask a specific question:
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="What specific aspect would you like help with?"
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={handleCustomQuestion}
                      disabled={!customQuestion.trim() || isLoading}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI tutor is analyzing your question and course context...
                </p>
              </div>
            )}

            {/* Tutor Response */}
            {tutorResponse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    AI Tutor Response
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    Context-Aware
                  </Badge>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{tutorResponse}</ReactMarkdown>
                  </div>
                </div>

                {/* Ethical Notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1">Academic Integrity Notice</p>
                    <p>This help is designed to guide your learning, not provide direct answers. Use this guidance to develop your understanding and solve the problem yourself.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setTutorResponse("");
                      setHelpType("hint");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Ask Different Question
                  </Button>
                  <Button
                    onClick={onClose}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    Continue Exam
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DragDrop } from "@/components/ui/drag-drop";
import { Plus, GripVertical, Trash2 } from "lucide-react";

interface Rule {
  id: string;
  content: string;
}

interface RulesSettingsProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

export function RulesSettings({ group, currentUser, isCreator }: RulesSettingsProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState("");

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, { id: Date.now().toString(), content: newRule.trim() }]);
      setNewRule("");
    }
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleReorderRules = (newRules: Rule[]) => {
    setRules(newRules);
  };

  const renderRule = (rule: Rule, index: number) => (
    <Card key={rule.id} className="p-4 flex items-center gap-4">
      <div className="cursor-move">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm">{rule.content}</p>
      </div>
      {isCreator && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteRule(rule.id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Group Rules</h2>
      </div>

      {isCreator && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a new rule..."
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
          />
          <Button onClick={handleAddRule}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      )}

      <DragDrop
        items={rules}
        onReorder={handleReorderRules}
        renderItem={renderRule}
        className="mt-4"
      />
    </div>
  );
} 
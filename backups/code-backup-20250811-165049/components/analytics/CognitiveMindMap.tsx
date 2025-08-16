"use client";

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { 
  Brain, Target, Lightbulb, Users, Book, Star, Zap, 
  TrendingUp, Eye, MessageSquare, Wrench, Search, Scale, Palette,
  ArrowRight, Plus, Minus, RotateCcw, Maximize2, Filter, 
  ChevronDown, ChevronUp, Play, Pause, MousePointer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CognitiveProfile {
  overallScore: number;
  bloomsLevels: any[];
  strengths: string[];
  weaknesses: string[];
  learningStyle: string;
  cognitiveGrowth: number;
  recommendedFocus: string[];
  nextMilestones: string[];
  studyEfficiency: number;
  retentionRate: number;
  conceptualUnderstanding: number;
  applicationSkills: number;
}

interface CognitiveMindMapProps {
  cognitiveData: CognitiveProfile;
}

interface MindMapNode {
  id: string;
  label: string;
  value: number;
  color: string;
  icon: any;
  children?: MindMapNode[];
  description: string;
  recommendations: string[];
}

export function CognitiveMindMap({ cognitiveData }: CognitiveMindMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['cognitive-core']));
  const [isAnimating, setIsAnimating] = useState(true);
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>({});
  const constraintsRef = useRef(null);

  // Create the mind map structure based on cognitive data
  const mindMapData: MindMapNode = {
    id: 'cognitive-core',
    label: 'Cognitive Profile',
    value: cognitiveData.overallScore,
    color: 'from-purple-500 to-indigo-600',
    icon: Brain,
    description: `Overall cognitive development at ${cognitiveData.overallScore}% proficiency`,
    recommendations: [
      'Continue building on existing strengths',
      'Focus on identified improvement areas',
      'Maintain consistent learning patterns'
    ],
    children: [
      {
        id: 'blooms-taxonomy',
        label: "Bloom's Levels",
        value: Math.round(cognitiveData.bloomsLevels.reduce((sum, level) => sum + level.score, 0) / cognitiveData.bloomsLevels.length),
        color: 'from-emerald-500 to-teal-600',
        icon: Target,
        description: 'Performance across all six cognitive levels',
        recommendations: [
          'Practice higher-order thinking skills',
          'Focus on application and analysis',
          'Develop creative problem-solving'
        ],
        children: cognitiveData.bloomsLevels.map(level => ({
          id: `blooms-${level.level.toLowerCase()}`,
          label: level.level,
          value: level.score,
          color: level.color,
          icon: getBloomsIcon(level.level),
          description: level.description,
          recommendations: level.improvements.slice(0, 3)
        }))
      },
      {
        id: 'learning-efficiency',
        label: 'Learning Efficiency',
        value: cognitiveData.studyEfficiency,
        color: 'from-blue-500 to-cyan-600',
        icon: Zap,
        description: 'How effectively you learn and retain information',
        recommendations: [
          'Optimize study schedule timing',
          'Use active learning techniques',
          'Take regular breaks for better retention'
        ],
        children: [
          {
            id: 'retention',
            label: 'Retention Rate',
            value: cognitiveData.retentionRate,
            color: 'from-blue-400 to-blue-500',
            icon: Brain,
            description: 'How well you remember learned information',
            recommendations: ['Use spaced repetition', 'Connect new info to existing knowledge']
          },
          {
            id: 'understanding',
            label: 'Understanding',
            value: cognitiveData.conceptualUnderstanding,
            color: 'from-indigo-400 to-indigo-500',
            icon: Lightbulb,
            description: 'Depth of conceptual comprehension',
            recommendations: ['Explain concepts to others', 'Use analogies and examples']
          }
        ]
      },
      {
        id: 'strengths',
        label: 'Cognitive Strengths',
        value: 85, // Calculated based on top performing areas
        color: 'from-green-500 to-emerald-600',
        icon: Star,
        description: 'Your cognitive advantages and strong areas',
        recommendations: cognitiveData.strengths.slice(0, 3),
        children: cognitiveData.strengths.slice(0, 4).map((strength, idx) => ({
          id: `strength-${idx}`,
          label: strength.split(' ').slice(0, 3).join(' '),
          value: 90 - (idx * 5),
          color: 'from-green-400 to-green-500',
          icon: Star,
          description: strength,
          recommendations: [`Leverage this strength in learning`]
        }))
      },
      {
        id: 'improvement-areas',
        label: 'Growth Areas',
        value: 45, // Areas needing improvement
        color: 'from-orange-500 to-red-600',
        icon: TrendingUp,
        description: 'Areas with the most potential for growth',
        recommendations: cognitiveData.recommendedFocus.slice(0, 3),
        children: cognitiveData.weaknesses.slice(0, 4).map((weakness, idx) => ({
          id: `weakness-${idx}`,
          label: weakness.split(' ').slice(0, 3).join(' '),
          value: 40 + (idx * 5),
          color: 'from-orange-400 to-orange-500',
          icon: Target,
          description: weakness,
          recommendations: [`Focus practice on this area`]
        }))
      }
    ]
  };

  function getBloomsIcon(level: string) {
    const icons = {
      'Remember': Eye,
      'Understand': MessageSquare,
      'Apply': Wrench,
      'Analyze': Search,
      'Evaluate': Scale,
      'Create': Palette
    };
    return icons[level as keyof typeof icons] || Brain;
  }

  // Filter nodes based on category
  const shouldShowNode = useCallback((node: MindMapNode, depth: number) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'strengths' && node.id.includes('strength')) return true;
    if (filterCategory === 'weaknesses' && node.id.includes('weakness')) return true;
    if (filterCategory === 'blooms' && node.id.includes('blooms')) return true;
    if (depth === 0) return true; // Always show core
    return false;
  }, [filterCategory]);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const renderNode = (node: MindMapNode, depth: number = 0, parentAngle: number = 0, index: number = 0) => {
    const Icon = node.icon;
    const isSelected = selectedNode === node.id;
    const isHovered = hoveredNode === node.id;
    const isCore = depth === 0;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const angle = isCore ? 0 : parentAngle + ((index / (node.children?.length || 1)) * 360);
    
    // Check if node should be shown based on filter
    if (!shouldShowNode(node, depth)) return null;
    
    // Calculate position for non-core nodes
    const radius = isCore ? 0 : 120 + (depth * 60);
    const defaultX = isCore ? 0 : Math.cos((angle * Math.PI) / 180) * radius;
    const defaultY = isCore ? 0 : Math.sin((angle * Math.PI) / 180) * radius;
    
    // Use custom position if dragged, otherwise use calculated position
    const x = nodePositions[node.id]?.x ?? defaultX;
    const y = nodePositions[node.id]?.y ?? defaultY;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: zoomLevel * (isCore ? 1 : 0.8),
          x: x * zoomLevel,
          y: y * zoomLevel
        }}
        transition={{ delay: depth * 0.2 + index * 0.1 }}
        className={`absolute cursor-pointer transition-all duration-300 ${
          isCore ? 'z-20' : 'z-10'
        }`}
        style={{
          left: isCore ? '50%' : `calc(50% + ${x}px)`,
          top: isCore ? '50%' : `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        drag={isDraggingEnabled && !isCore}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={(event, info) => {
          if (isDraggingEnabled && !isCore) {
            setNodePositions(prev => ({
              ...prev,
              [node.id]: {
                x: (nodePositions[node.id]?.x ?? defaultX) + info.offset.x,
                y: (nodePositions[node.id]?.y ?? defaultY) + info.offset.y
              }
            }));
          }
        }}
      >
        {/* Connection Lines */}
        {!isCore && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.3, scaleX: 1 }}
            transition={{ delay: (depth * 0.2 + index * 0.1) + 0.3 }}
            className="absolute w-full h-0.5 bg-gradient-to-r from-purple-300 to-transparent dark:from-purple-600"
            style={{
              transformOrigin: '0 50%',
              transform: `rotate(${180 + angle}deg)`,
              width: `${radius}px`,
              left: `-${radius}px`,
              top: '50%'
            }}
          />
        )}

        {/* Node */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            boxShadow: isSelected ? '0 0 0 4px rgba(168, 85, 247, 0.4)' : 
                      isHovered ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 15px rgba(0,0,0,0.1)'
          }}
          className={`relative ${isCore ? 'w-24 h-24' : 'w-16 h-16'} rounded-full
            bg-gradient-to-br ${node.color} shadow-lg border-4 border-white dark:border-slate-800
            flex items-center justify-center text-white cursor-pointer ${
              isDraggingEnabled && !isCore ? 'cursor-move' : 'cursor-pointer'
            }`}
        >
          <Icon className={`${isCore ? 'w-8 h-8' : 'w-6 h-6'}`} />
          
          {/* Expand/Collapse Indicator */}
          {hasChildren && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 
                border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.id);
              }}
            >
              {isExpanded ? 
                <ChevronUp className="w-3 h-3 text-slate-600 dark:text-slate-400" /> :
                <ChevronDown className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              }
            </motion.div>
          )}
          
          {/* Performance Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: depth * 0.2 + index * 0.1 + 0.5 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 
              border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center"
          >
            <span className={`text-xs font-bold ${
              node.value >= 80 ? 'text-green-600' :
              node.value >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {node.value}
            </span>
          </motion.div>
        </motion.div>

        {/* Node Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: depth * 0.2 + index * 0.1 + 0.3 }}
          className={`absolute top-full mt-2 text-center ${isCore ? 'w-32' : 'w-24'}`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className={`${isCore ? 'text-sm' : 'text-xs'} font-semibold 
            text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 
            backdrop-blur-sm rounded px-2 py-1 shadow-sm`}>
            {node.label}
          </div>
        </motion.div>

        {/* Interactive Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -120%)',
                maxWidth: '200px'
              }}
            >
              {/* Tooltip Container with improved visibility */}
              <div className="relative">
                {/* Main tooltip content */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl 
                  border-2 border-slate-200 dark:border-slate-600 backdrop-blur-md
                  bg-opacity-95 dark:bg-opacity-95">
                  
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5">
                    <div className="w-3 h-3 bg-white dark:bg-slate-900 border-r-2 border-b-2 
                      border-slate-200 dark:border-slate-600 transform rotate-45"></div>
                  </div>
                  
                  <div className="text-sm text-center">
                    {/* Node icon */}
                    <div className="flex justify-center mb-2">
                      <div className={`p-2 rounded-full bg-gradient-to-br ${node.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    {/* Node title */}
                    <div className="font-bold text-slate-900 dark:text-white mb-2 text-base">
                      {node.label}
                    </div>
                    
                    {/* Node description */}
                    <div className="text-slate-600 dark:text-slate-300 mb-3 text-xs leading-relaxed">
                      {node.description}
                    </div>
                    
                    {/* Proficiency badge */}
                    <div className="flex justify-center">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        node.value >= 80 ? 'bg-emerald-500 text-white' :
                        node.value >= 60 ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        <Star className="w-3 h-3 mr-1" />
                        {node.value}% Proficiency
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render children recursively */}
        {isExpanded && node.children?.map((child, childIndex) => 
          renderNode(child, depth + 1, angle, childIndex)
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mind Map Container */}
      <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Interactive Cognitive Mind Map
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Filter Controls */}
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1 
                  bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Nodes</option>
                <option value="strengths">Strengths</option>
                <option value="weaknesses">Growth Areas</option>
                <option value="blooms">Bloom&apos;s Levels</option>
              </select>
              
              {/* Drag Toggle */}
              <Button 
                variant={isDraggingEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDraggingEnabled(!isDraggingEnabled)}
                className="gap-1"
              >
                <MousePointer className="w-4 h-4" />
                {isDraggingEnabled ? 'Lock' : 'Drag'}
              </Button>
              
              {/* Animation Toggle */}
              <Button 
                variant={isAnimating ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={constraintsRef}
            className="relative w-full h-96 overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600"
          >
            {renderNode(mindMapData)}
          </div>
          <div className="mt-4 text-center space-y-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {isDraggingEnabled ? 
                'Drag nodes to reposition • Click expand/collapse buttons • Hover for details' :
                'Click nodes for details • Hover for quick info • Enable drag mode to reposition'
              }
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500 dark:text-slate-500">
              <span>Filter: {filterCategory === 'all' ? 'All Categories' : filterCategory}</span>
              <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
              <span>Animation: {isAnimating ? 'On' : 'Off'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {(() => {
              const findNode = (node: MindMapNode): MindMapNode | null => {
                if (node.id === selectedNode) return node;
                if (node.children) {
                  for (const child of node.children) {
                    const found = findNode(child);
                    if (found) return found;
                  }
                }
                return null;
              };
              
              const node = findNode(mindMapData);
              if (!node) return null;
              
              const Icon = node.icon;
              
              return (
                <Card className="border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${node.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            {node.label}
                          </h3>
                          <Badge className={`${
                            node.value >= 80 ? 'bg-green-100 text-green-800' :
                            node.value >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {node.value}% Proficiency
                          </Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">{node.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                              Performance Level
                            </h4>
                            <Progress value={node.value} className="mb-2" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {node.value >= 80 ? 'Excellent - Strong performance' :
                               node.value >= 60 ? 'Good - Room for improvement' :
                               'Needs Focus - Priority development area'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                              Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {node.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <ArrowRight className="w-3 h-3 mt-1 text-purple-500 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">80%+ Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">60-79% Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">&lt;60% Needs Focus</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// Script to update all component files with dark theme
const fs = require('fs');
const path = require('path');

const componentsDir = '/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/dashboard/user/_components/smart-dashboard';

const replacements = [
  // Card backgrounds
  { from: /bg-gradient-to-r from-white to-[\w-\/]+/g, to: 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50' },
  { from: /bg-gradient-to-b from-white to-[\w-\/]+/g, to: 'bg-gradient-to-b from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50' },
  { from: /bg-white\/\d+/g, to: 'bg-slate-800/60 border border-slate-600/30' },
  
  // Text colors
  { from: /text-gray-900/g, to: 'text-white' },
  { from: /text-gray-800/g, to: 'text-slate-100' },
  { from: /text-gray-700/g, to: 'text-slate-300' },
  { from: /text-gray-600/g, to: 'text-slate-400' },
  { from: /text-gray-500/g, to: 'text-slate-500' },
  
  // Card titles and headers
  { from: /"([^"]*)"(?=\s*<\/CardTitle>)/g, to: '"<span className=\\"text-white\\">$1</span>"' },
];

const files = [
  'SmartActionDashboard.tsx',
  'CommunityImpactCenter.tsx', 
  'GamificationEngine.tsx',
  'PredictiveAnalytics.tsx',
  'RealtimePulse.tsx',
  'FloatingAITutor.tsx'
];

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
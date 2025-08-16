// Helper function to detect language from code content
export const detectCodeLanguage = (code: string): string => {
  if (!code) return 'javascript';
  
  // Simple language detection based on content patterns
  if (code.includes('function') && code.includes('=>')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('public class') || code.includes('System.out')) return 'java';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('<?php')) return 'php';
  if (code.includes('<html>') || code.includes('<div>')) return 'html';
  if (code.includes('const ') || code.includes('interface ')) return 'typescript';
  
  return 'javascript'; // default
};

// Helper function to parse code blocks
export const parseCodeBlocks = (codeString: string) => {
  if (!codeString) return [];
  
  // Split by the delimiter used in the form
  const blocks = codeString.split('\n\n// Next Code Block\n\n').filter(block => block.trim());
  return blocks.map((block, index) => ({
    id: index,
    code: block.trim(),
    language: detectCodeLanguage(block)
  }));
};

// Helper function to parse explanation blocks
export const parseExplanationBlocks = (explanationString: string) => {
  if (!explanationString) return [];
  
  // Split by the delimiter used in the form
  const blocks = explanationString.split('\n\n<hr />\n\n').filter(block => block.trim());
  return blocks.map((block, index) => ({
    id: index,
    explanation: block.trim()
  }));
};

// Custom styles for hiding scrollbars
export const hideScrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Custom smooth expand animation */
  .expand-content {
    animation: expandDown 0.3s ease-out;
    transform-origin: top;
  }
  
  @keyframes expandDown {
    from {
      opacity: 0;
      transform: scaleY(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scaleY(1) translateY(0);
    }
  }
`;

// Inject custom styles function
export const injectCustomStyles = () => {
  if (typeof document !== 'undefined') {
    const styleElement = document.getElementById('explanations-list-styles');
    if (!styleElement) {
      const style = document.createElement('style');
      style.id = 'explanations-list-styles';
      style.textContent = hideScrollbarStyles;
      document.head.appendChild(style);
    }
  }
}; 
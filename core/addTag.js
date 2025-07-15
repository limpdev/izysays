// -----------------------------------------------------------------------------
// Enhanced Text Processing Functions for Chrome Extension
// -----------------------------------------------------------------------------

/**
 * Adds mark tags for highlighted text (==text==)
 * @param {string} text - The text to process
 * @returns {string} - Text with mark tags applied
 */
function addMarkTags(text) {
  // Regex finds any text between == and == (non-greedy)
  const markRegex = /==(.*?)==/g;
  const markReplace = (match, content) => {
    return `<mark>${content}</mark>`;
  };
  return text.replace(markRegex, markReplace);
}

/**
 * Adds superscript spans for ^text^
 * @param {string} text - The text to process
 * @returns {string} - Text with superscript spans applied
 */
function addSuperScript(text) {
  const superRegex = /\^(.*?)\^/g;
  const superReplace = (match, content) => {
    return `<sup class="suptext">${content}</sup>`;
  };
  return text.replace(superRegex, superReplace);
}

/**
 * Adds subscript spans for _-text-_
 * @param {string} text - The text to process
 * @returns {string} - Text with subscript spans applied
 */
function addSubScript(text) {
  // Fixed regex pattern - the original had issues
  const subRegex = /\_-(.*?)-\_/g;
  const subReplace = (match, content) => {
    return `<sub class="subtext">${content}</sub>`;
  };
  return text.replace(subRegex, subReplace);
}

/**
 * Applies all text transformations to an element
 * @param {string} selector - CSS selector for the target element
 */
function applyTextTransformations(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`[TextTransformations] Element with selector "${selector}" not found.`);
    return;
  }

  // Store original innerHTML
  let content = element.innerHTML;
  
  // Apply all transformations in sequence
  content = addMarkTags(content);
  content = addSuperScript(content);
  content = addSubScript(content);
  
  // Update the element
  element.innerHTML = content;
}

/**
 * Applies transformations to all text nodes while preserving existing HTML structure
 * More robust than innerHTML manipulation
 * @param {Element} element - The element to process
 */
function applyTextTransformationsToTextNodes(element) {
  // Skip if this is a script, style, or already processed element
  if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(element.tagName)) {
    return;
  }

  // Process text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip empty text nodes and those in code blocks
        if (!node.textContent.trim() || 
            node.parentElement.tagName === 'CODE' ||
            node.parentElement.tagName === 'PRE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // Process each text node
  textNodes.forEach(textNode => {
    let content = textNode.textContent;
    const originalContent = content;
    
    // Apply transformations
    content = addMarkTags(content);
    content = addSuperScript(content);
    content = addSubScript(content);
    
    // Only update if content changed
    if (content !== originalContent) {
      // Create a temporary element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Replace the text node with the new HTML content
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

/**
 * Safe function to apply transformations after markdown processing
 * This integrates with your existing markdown renderer
 */
function applySafeTextTransformations() {
  // Wait a bit to ensure markdown processing is complete
  setTimeout(() => {
    const contentContainer = document.querySelector('#markdown-content-container');
    if (contentContainer) {
      applyTextTransformationsToTextNodes(contentContainer);
      console.log('Text transformations applied to markdown content');
    } else {
      // Fallback to body if container not found
      applyTextTransformationsToTextNodes(document.body);
      console.log('Text transformations applied to body');
    }
  }, 100);
}

/**
 * Initialize text transformations
 * This will be called from your main content script
 */
function initializeTextTransformations() {
  // Check if we're on a markdown file
  const isMarkdownFile = window.location.pathname.endsWith('.md') || 
                         window.location.pathname.endsWith('.markdown') || 
                         window.location.pathname.endsWith('.mdown');
  
  if (isMarkdownFile) {
    // For markdown files, apply after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applySafeTextTransformations);
    } else {
      applySafeTextTransformations();
    }
  }
}

// CSS styles for the text transformations
const textTransformationStyles = `
  /* Mark/highlight styles */
  mark {
    background-color: #ffeb3b;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }
  
  /* Superscript styles */
  .suptext, sup.suptext {
    font-size: 0.75em;
    vertical-align: super;
    color: #2196f3;
  }
  
  /* Subscript styles */
  .subtext, sub.subtext {
    font-size: 0.75em;
    vertical-align: sub;
    color: #ff5722;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    mark {
      background-color: #ffa000;
      color: #000;
    }
    
    .suptext, sup.suptext {
      color: #64b5f6;
    }
    
    .subtext, sub.subtext {
      color: #ff8a65;
    }
  }
`;

/**
 * Inject styles for text transformations
 */
function injectTextTransformationStyles() {
  const styleId = 'text-transformation-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = textTransformationStyles;
  document.head.appendChild(style);
}

// Export functions for use in main content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addMarkTags,
    addSuperScript,
    addSubScript,
    applyTextTransformations,
    applyTextTransformationsToTextNodes,
    applySafeTextTransformations,
    initializeTextTransformations,
    injectTextTransformationStyles
  };
}

// Auto-initialize if loaded directly
if (typeof window !== 'undefined') {
  injectTextTransformationStyles();
  initializeTextTransformations();
}
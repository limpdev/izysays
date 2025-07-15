## `core/addTag.js`

```javascript
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
```

## `core/copyCode.js`

```javascript
// Codeblock Copy Buttons
// adds copy buttons to codeblocks (pre tags)
function addCopyButtons() {
    const defaultSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.997 4.17A3 3 0 0 1 20 7v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 2.003-2.83A4 4 0 0 0 10 8h4a4 4 0 0 0 3.98-3.597zM14 2a2 2 0 1 1 0 4h-4a2 2 0 1 1 0-4z"/></svg>';
    const successSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none"><path fill="currentColor" fill-opacity="0.16" d="M8 3H5.4A2.4 2.4 0 0 0 3 5.4v15.2A2.4 2.4 0 0 0 5.4 23h13.2a2.4 2.4 0 0 0 2.4-2.4V5.4A2.4 2.4 0 0 0 18.6 3H16v1.2a.8.8 0 0 1-.8.8H8.8a.8.8 0 0 1-.8-.8z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 3h2.6A2.4 2.4 0 0 1 21 5.4v15.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 20.6V5.4A2.4 2.4 0 0 1 5.4 3H8m0 11l3 3l5-7M8.8 1h6.4a.8.8 0 0 1 .8.8v2.4a.8.8 0 0 1-.8.8H8.8a.8.8 0 0 1-.8-.8V1.8a.8.8 0 0 1 .8-.8"/></g></svg>';
    const preBlocks = document.querySelectorAll('pre');

    preBlocks.forEach((pre) => {
        const button = document.createElement('button');
        button.className = 'codebtn';
        button.innerHTML = defaultSVG;
        button.addEventListener('click', () => {
            navigator.clipboard.writeText(pre.innerText).then(() => {
                button.innerHTML = successSVG;
                setTimeout(() => {
                    button.innerHTML = defaultSVG;
                }, 2000);
            });
        });
        pre.parentNode.insertBefore(button, pre);
    })
}
```

## `core/rippleEffect.js`

```javascript
// Ripple effect for every mouse click, anywhere on the page using an SVG
document.addEventListener('click', function (e) {
	// Create a container for the ripple effect
	const rippleContainer = document.createElement('div');
	rippleContainer.style.position = 'fixed';
	rippleContainer.style.left = e.clientX - 48 + 'px'; // Center the ripple at click position
	rippleContainer.style.top = e.clientY - 48 + 'px';
	rippleContainer.style.pointerEvents = 'none'; // Don't interfere with further clicks
	rippleContainer.style.zIndex = '9999';

	// Create SVG element
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('width', '96');
	svg.setAttribute('height', '96');
	svg.setAttribute('viewBox', '0 0 24 24');

	// Create circle element
	const circle = document.createElementNS(svgNS, 'circle');
	circle.setAttribute('cx', '12');
	circle.setAttribute('cy', '12');
	circle.setAttribute('r', '0');
	circle.setAttribute('fill', 'rgba(168, 168, 168, 0.5)');

	// Create animate elements
	const animateRadius = document.createElementNS(svgNS, 'animate');
	animateRadius.setAttribute('attributeName', 'r');
	animateRadius.setAttribute('calcMode', 'spline');
	animateRadius.setAttribute('dur', '0.4s');
	animateRadius.setAttribute('keySplines', '.52,.6,.25,.99');
	animateRadius.setAttribute('values', '0;11');
	animateRadius.setAttribute('fill', 'freeze');

	const animateOpacity = document.createElementNS(svgNS, 'animate');
	animateOpacity.setAttribute('attributeName', 'opacity');
	animateOpacity.setAttribute('calcMode', 'spline');
	animateOpacity.setAttribute('dur', '0.4s');
	animateOpacity.setAttribute('keySplines', '.52,.6,.25,.99');
	animateOpacity.setAttribute('values', '1;0');
	animateOpacity.setAttribute('fill', 'freeze');

	// Assemble the SVG
	circle.appendChild(animateRadius);
	circle.appendChild(animateOpacity);
	svg.appendChild(circle);
	rippleContainer.appendChild(svg);

	// Add to document
	document.body.appendChild(rippleContainer);

	// Remove after animation completes
	setTimeout(() => {
		document.body.removeChild(rippleContainer);
	}, 500); // Match the duration of the animation
});

```

## `dist/assets/loading-page-1924caaa.js`

```javascript
const VITE_URL = "http://localhost:5173";
document.body.innerHTML = `
<div
      id="app"
      style="
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      "
    >
      <h1 style="color: #333">Vite Dev Mode</h1>
      <p style="color: #666">
        Cannot connect to the Vite Dev Server on <a href="${VITE_URL}">${VITE_URL}</a>
      </p>
      <p style="color: #666">
        Double-check that Vite is working and reload the extension.
      </p>
      <p style="color: #666">
        This page will close when the extension reloads.
      </p>
      <button
        style="
          padding: 10px 20px;
          border: none;
          background-color: #007bff;
          color: #fff;
          border-radius: 5px;
          cursor: pointer;
        "
      >
        Reload Extension
      </button>
    </div>`;
document.body.querySelector("button")?.addEventListener("click", () => {
  chrome.runtime.reload();
});
let tries = 0;
let ready = false;
do {
  try {
    await fetch(VITE_URL);
    ready = true;
  } catch {
    const timeout = Math.min(100 * Math.pow(2, ++tries), 5e3);
    console.log(`[CRXJS] Vite Dev Server is not available on ${VITE_URL}`);
    console.log(`[CRXJS] Retrying in ${timeout}ms...`);
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
} while (!ready);
location.reload();
```

## `dist/core/rippleEffect.js-loader.js`

```javascript
(function () {
  'use strict';

  const injectTime = performance.now();
  (async () => {
    if ("")
      await import(
        /* @vite-ignore */
        chrome.runtime.getURL("")
      );
    await import(
      /* @vite-ignore */
      chrome.runtime.getURL("vendor/vite-client.js")
    );
    const { onExecute } = await import(
      /* @vite-ignore */
      chrome.runtime.getURL("core/rippleEffect.js.js")
    );
    onExecute?.({ perf: { injectTime, loadTime: performance.now() - injectTime } });
  })().catch(console.error);

})();
```

## `dist/core/rippleEffect.js.js`

```javascript
// Ripple effect for every mouse click, anywhere on the page using an SVG
document.addEventListener('click', function (e) {
	// Create a container for the ripple effect
	const rippleContainer = document.createElement('div');
	rippleContainer.style.position = 'fixed';
	rippleContainer.style.left = e.clientX - 48 + 'px'; // Center the ripple at click position
	rippleContainer.style.top = e.clientY - 48 + 'px';
	rippleContainer.style.pointerEvents = 'none'; // Don't interfere with further clicks
	rippleContainer.style.zIndex = '9999';

	// Create SVG element
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('width', '96');
	svg.setAttribute('height', '96');
	svg.setAttribute('viewBox', '0 0 24 24');

	// Create circle element
	const circle = document.createElementNS(svgNS, 'circle');
	circle.setAttribute('cx', '12');
	circle.setAttribute('cy', '12');
	circle.setAttribute('r', '0');
	circle.setAttribute('fill', 'rgba(168, 168, 168, 0.5)');

	// Create animate elements
	const animateRadius = document.createElementNS(svgNS, 'animate');
	animateRadius.setAttribute('attributeName', 'r');
	animateRadius.setAttribute('calcMode', 'spline');
	animateRadius.setAttribute('dur', '0.4s');
	animateRadius.setAttribute('keySplines', '.52,.6,.25,.99');
	animateRadius.setAttribute('values', '0;11');
	animateRadius.setAttribute('fill', 'freeze');

	const animateOpacity = document.createElementNS(svgNS, 'animate');
	animateOpacity.setAttribute('attributeName', 'opacity');
	animateOpacity.setAttribute('calcMode', 'spline');
	animateOpacity.setAttribute('dur', '0.4s');
	animateOpacity.setAttribute('keySplines', '.52,.6,.25,.99');
	animateOpacity.setAttribute('values', '1;0');
	animateOpacity.setAttribute('fill', 'freeze');

	// Assemble the SVG
	circle.appendChild(animateRadius);
	circle.appendChild(animateOpacity);
	svg.appendChild(circle);
	rippleContainer.appendChild(svg);

	// Add to document
	document.body.appendChild(rippleContainer);

	// Remove after animation completes
	setTimeout(() => {
		document.body.removeChild(rippleContainer);
	}, 500); // Match the duration of the animation
});

```

## `dist/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Vite Dev Mode</title>
    <script src="/assets/loading-page-1924caaa.js" type="module"></script>
  </head>
  <body
    style="font-family: Arial, sans-serif; padding: 20px; text-align: center"
  >
    <h1>Vite Dev Mode</h1>
  </body>
</html>
```

## `dist/service-worker-loader.js`

```javascript
import 'http://localhost:5173/@vite/env';
import 'http://localhost:5173/@crx/client-worker';
```

## `dist/src/content.js-loader.js`

```javascript
(function () {
  'use strict';

  const injectTime = performance.now();
  (async () => {
    if ("")
      await import(
        /* @vite-ignore */
        chrome.runtime.getURL("")
      );
    await import(
      /* @vite-ignore */
      chrome.runtime.getURL("vendor/vite-client.js")
    );
    const { onExecute } = await import(
      /* @vite-ignore */
      chrome.runtime.getURL("src/content.js.js")
    );
    onExecute?.({ perf: { injectTime, loadTime: performance.now() - injectTime } });
  })().catch(console.error);

})();
```

## `dist/src/content.js.js`

```javascript
import { unified } from "/vendor/.vite-deps-unified.js__v--a9872bb9.js";
import remarkParse from "/vendor/.vite-deps-remark-parse.js__v--a9872bb9.js";
import remarkGfm from "/vendor/.vite-deps-remark-gfm.js__v--a9872bb9.js";
import remarkRehype from "/vendor/.vite-deps-remark-rehype.js__v--a9872bb9.js";
import rehypeHighlight from "/vendor/.vite-deps-rehype-highlight.js__v--a9872bb9.js";
import rehypeStringify from "/vendor/.vite-deps-rehype-stringify.js__v--a9872bb9.js";
import a11yEmoji from "/vendor/.vite-deps-@fec_remark-a11y-emoji.js__v--a9872bb9.js";
import remarkFlexibleContainers from "/vendor/.vite-deps-remark-flexible-containers.js__v--a9872bb9.js";
import remarkFlexibleParagraphs from "/vendor/.vite-deps-remark-flexible-paragraphs.js__v--a9872bb9.js";
import remarkFrontmatter from "/vendor/.vite-deps-remark-frontmatter.js__v--a9872bb9.js"
import remarkDirective from "/vendor/.vite-deps-remark-directive.js__v--a9872bb9.js";
import remarkTextr from "/vendor/.vite-deps-remark-textr.js__v--a9872bb9.js"
import remarkToc from "/vendor/.vite-deps-remark-toc.js__v--a9872bb9.js"
import sectionize from "/vendor/.vite-deps-remark-sectionize.js__v--a9872bb9.js"
import remarkIns from "/vendor/.vite-deps-remark-ins.js__v--a9872bb9.js"
import remarkSupersub from "/vendor/.vite-deps-remark-supersub.js__v--a9872bb9.js"
import rehypeSlug from "/vendor/.vite-deps-rehype-slug.js__v--a9872bb9.js";
import rehypeAutolinkHeadings from "/vendor/.vite-deps-rehype-autolink-headings.js__v--a9872bb9.js"
import remarkGithubAdmonitionsToDirectives from "/vendor/.vite-deps-remark-github-admonitions-to-directives.js__v--a9872bb9.js";

// content.js - Integrated version with text transformations
// This version includes the text processing functions directly

// Language to Font Awesome icon mapping
const languageIcons = {
    javascript: 'fab fa-js-square',
    js: 'fab fa-js-square',
    typescript: 'fab fa-js-square',
    ts: 'fab fa-js-square',
    python: 'fab fa-python',
    py: 'fab fa-python',
    java: 'fab fa-java',
    php: 'fab fa-php',
    html: 'fab fa-html5',
    css: 'fab fa-css3-alt',
    scss: 'fab fa-sass',
    sass: 'fab fa-sass',
    less: 'fab fa-less',
    react: 'fab fa-react',
    jsx: 'fab fa-react',
    vue: 'fab fa-vuejs',
    angular: 'fab fa-angular',
    node: 'fab fa-node-js',
    nodejs: 'fab fa-node-js',
    npm: 'fab fa-npm',
    yarn: 'fab fa-yarn',
    docker: 'fab fa-docker',
    git: 'fab fa-git-alt',
    github: 'fab fa-github',
    gitlab: 'fab fa-gitlab',
    bitbucket: 'fab fa-bitbucket',
    go: 'fas fa-code',
    golang: 'fas fa-code',
    rust: 'fas fa-cog',
    cpp: 'fas fa-code',
    'c++': 'fas fa-code',
    c: 'fas fa-code',
    csharp: 'fas fa-code',
    'c#': 'fas fa-code',
    swift: 'fab fa-swift',
    kotlin: 'fas fa-code',
    ruby: 'fas fa-gem',
    rb: 'fas fa-gem',
    shell: 'fas fa-terminal',
    bash: 'fas fa-terminal',
    sh: 'fas fa-terminal',
    powershell: 'fas fa-terminal',
    sql: 'fas fa-database',
    mysql: 'fas fa-database',
    postgresql: 'fas fa-database',
    mongodb: 'fas fa-database',
    json: 'fas fa-file-code',
    xml: 'fas fa-code',
    yaml: 'fas fa-file-code',
    yml: 'fas fa-file-code',
    toml: 'fas fa-file-code',
    ini: 'fas fa-file-code',
    markdown: 'fab fa-markdown',
    md: 'fab fa-markdown',
    text: 'fas fa-file-alt',
    txt: 'fas fa-file-alt',
    default: 'fas fa-code'
};

// -----------------------------------------------------------------------------
// TEXT TRANSFORMATION FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Adds mark tags for highlighted text (==text==)
 */
function addMarkTags(text) {
    const markRegex = /==(.*?)==/g;
    return text.replace(markRegex, '<mark>$1</mark>');
}

/**
 * Adds superscript spans for ^text^
 */
function addSuperScript(text) {
    const superRegex = /\^(.*?)\^/g;
    return text.replace(superRegex, '<sup class="suptext">$1</sup>');
}

/**
 * Adds subscript spans for _-text-_
 */
function addSubScript(text) {
    const subRegex = /\_-(.*?)-\_/g;
    return text.replace(subRegex, '<sub class="subtext">$1</sub>');
}

/**
 * Applies all text transformations to text nodes while preserving HTML structure
 */
function applyTextTransformationsToTextNodes(element) {
    if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(element.tagName)) {
        return;
    }

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
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

    textNodes.forEach(textNode => {
        let content = textNode.textContent;
        const originalContent = content;
        
        // Apply transformations
        content = addMarkTags(content);
        content = addSuperScript(content);
        content = addSubScript(content);
        
        if (content !== originalContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            textNode.parentNode.replaceChild(fragment, textNode);
        }
    });
}

// -----------------------------------------------------------------------------
// MARKDOWN PROCESSING FUNCTIONS
// -----------------------------------------------------------------------------

// Helper function to traverse AST nodes
function visit(node, callback) {
    callback(node);
    if (node.children) {
        node.children.forEach(child => visit(child, callback));
    }
}

// Custom rehype plugin to add language icons to code blocks
function rehypeCodeLanguageIcons() {
    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'element' && node.tagName === 'pre') {
                const codeElement = node.children.find(child =>
                    child.type === 'element' && child.tagName === 'code'
                );

                if (codeElement && codeElement.properties && codeElement.properties.className) {
                    const languageClass = codeElement.properties.className.find(cls =>
                        cls.startsWith('language-')
                    );

                    if (languageClass) {
                        const language = languageClass.replace('language-', '').toLowerCase();
                        const iconClass = languageIcons[language] || languageIcons.default;

                        if (!node.properties) node.properties = {};
                        if (!node.properties.className) node.properties.className = [];
                        node.properties.className.push('has-language');
                        node.properties['data-language'] = language;

                        const languageIcon = {
                            type: 'element',
                            tagName: 'div',
                            properties: {
                                className: ['language-icon']
                            },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'i',
                                    properties: {
                                        className: iconClass.split(' '),
                                        title: language.toUpperCase()
                                    },
                                    children: []
                                }
                            ]
                        };

                        node.children.unshift(languageIcon);
                    }
                }
            }
        });
    };
}

function rehypeAdmonitions() {
    const admonitionTypes = ['note', 'tip', 'important', 'success', 'warning', 'caution', 'danger', 'error'];
    const admonitionIcons = {
        note: 'fas fa-info-circle',
        tip: 'fas fa-lightbulb',
        important: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        caution: 'fas fa-exclamation-triangle',
        danger: 'fas fa-skull-crossbones',
        error: 'fas fa-times-circle',
    };

    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'containerDirective') {
                const type = node.name.toLowerCase();
                if (admonitionTypes.includes(type)) {
                    node.type = 'element';
                    node.tagName = 'div';
                    node.properties = {
                        className: ['admonition', `admonition-${type}`]
                    };

                    const titleText = node.children[0]?.data?.value || type.charAt(0).toUpperCase() + type.slice(1);
                    const titleIconClass = admonitionIcons[type] || 'fas fa-info-circle';

                    const titleNode = {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: ['admonition-title'] },
                        children: [
                            {
                                type: 'element',
                                tagName: 'i',
                                properties: { className: titleIconClass.split(' ') },
                                children: []
                            },
                            {
                                type: 'text',
                                value: ` ${titleText}`,
                            }
                        ]
                    };
                    
                    const contentNode = {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: ['admonition-content'] },
                        children: node.children.slice(1)
                    };

                    node.children = [titleNode, contentNode];
                }
            }
        });
    };
}

// Simple ellipses plugin for remarkTextr
function ellipses(input) {
    return input.replace(/\.\.\./g, '…');
}

// Dynamic module loading function
async function loadModules() {
    try {
        const modules = await Promise.all([
            import("/vendor/.vite-deps-unified.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-parse.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-gfm.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-rehype.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-rehype-highlight.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-rehype-stringify.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-@fec_remark-a11y-emoji.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-frontmatter.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-directive.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-textr.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-toc.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-sectionize.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-ins.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-supersub.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-rehype-slug.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-rehype-autolink-headings.js__v--a9872bb9.js"),
            import("/vendor/.vite-deps-remark-github-admonitions-to-directives.js__v--a9872bb9.js")
        ]);

        return {
            unified: modules[0].unified,
            remarkParse: modules[1].default,
            remarkGfm: modules[2].default,
            remarkRehype: modules[3].default,
            rehypeHighlight: modules[4].default,
            rehypeStringify: modules[5].default,
            a11yEmoji: modules[6].default,
            remarkFrontmatter: modules[7].default,
            remarkDirective: modules[8].default,
            remarkTextr: modules[9].default,
            remarkToc: modules[10].default,
            sectionize: modules[11].default,
            remarkIns: modules[12].default,
            remarkSupersub: modules[13].default,
            rehypeSlug: modules[14].default,
            rehypeAutolinkHeadings: modules[15].default,
            remarkGithubAdmonitionsToDirectives: modules[16].default
        };
    } catch (error) {
        console.error('Failed to load modules:', error);
        throw new Error('Could not load required markdown processing modules');
    }
}

async function renderMarkdown() {
    try {
        const preElement = document.querySelector("pre");
        if (!preElement || !preElement.textContent) {
            console.log("zysays: No markdown content found.");
            return;
        }

        const isMarkdownFile = window.location.pathname.endsWith(".md") || 
                              window.location.pathname.endsWith(".markdown") || 
                              window.location.pathname.endsWith(".mdown");
        if (!isMarkdownFile) {
            console.log("zysays: Not a markdown file.");
            return;
        }

        document.body.style.display = "none";
        
        // Show loading message
        document.body.innerHTML = `
            <div style="padding: 20px; font-family: "Zed Plex Sans", sans-serif; text-align: center;">
                <h2> Processing  </h2>
                <p>Please wait while the markdown modules are loaded.</p>
            </div>
        `;

        // Dynamically load all required modules
        const modules = await loadModules();
        
        const rawMarkdown = preElement.textContent;
        
        const processor = modules.unified()
            .use(modules.remarkParse)
            .use(modules.remarkGfm)
            .use(modules.remarkFrontmatter, ['yaml', 'toml'])
            .use(modules.remarkGithubAdmonitionsToDirectives)
            .use(modules.remarkDirective)
            .use(modules.remarkToc, { heading: 'toc|table[ -]of[ -]contents' })
            .use(modules.sectionize)
            .use(modules.remarkTextr, { plugins: [ellipses] })
            .use(modules.a11yEmoji)
            .use(modules.remarkIns)
            .use(modules.remarkSupersub)
            .use(modules.remarkRehype, { allowDangerousHtml: true })
            .use(modules.rehypeSlug)
            .use(modules.rehypeAutolinkHeadings, {
                behavior: 'prepend',
                properties: { className: ['heading-anchor-link'] },
                content: { type: 'text', value: '#' }
            })
            .use(modules.rehypeHighlight)
            .use(rehypeCodeLanguageIcons)
            .use(rehypeAdmonitions)
            .use(modules.rehypeStringify, { allowDangerousHtml: true });

        const file = await processor.process(rawMarkdown);
        const renderedHtml = String(file);

        if (window.stop) window.stop();

        const title = document.title || window.location.pathname.split("/").pop() || "Markdown Preview";

        document.documentElement.innerHTML = `
            <head>
                <meta charset="UTF-8">
                <link rel="shortcut-icon" type="image/png" href="${chrome.runtime.getURL("vite.svg")}"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
                <link rel="stylesheet" href="style.css" />
                <title>${title}</title>
            </head>
            <body>
                <div id="markdown-content-container">
                    ${renderedHtml}
                </div>
            </body>
        `;

        // Inject main stylesheet
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("style.css");
        document.head.appendChild(link);

        // Add interactive features
        addCodeCopyButtons();
        
        // Apply text transformations AFTER markdown processing
        setTimeout(() => {
            const contentContainer = document.querySelector('#markdown-content-container');
            if (contentContainer) {
                applyTextTransformationsToTextNodes(contentContainer);
                console.log('Text transformations applied successfully');
            }
        }, 100);

        document.body.style.display = "block";

    } catch (error) {
        console.error("Error rendering markdown:", error);
        document.body.style.display = "block";
        
        document.body.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Error Rendering Markdown</h2>
                <p>There was an error processing this markdown file:</p>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${error.message}</pre>
                <details style="margin-top: 10px;">
                    <summary>Technical Details</summary>
                    <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 12px;">${error.stack}</pre>
                </details>
            </div>
        `;
    }
}

function addCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach(block => {
        const codeElement = block.querySelector('code');
        if (!codeElement) return;

        const button = document.createElement('button');
        button.className = 'copy-code-button';
        button.innerHTML = '<i class="fas fa-copy"></i>';

        button.addEventListener('click', async () => {
            try {
                const codeToCopy = codeElement.innerText;
                await navigator.clipboard.writeText(codeToCopy);
                
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code: ', err);
                button.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            }
        });

        block.insertBefore(button, block.firstChild);
    });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMarkdown);
} else {
    renderMarkdown();
}
```

## `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## `src/content.js`

```javascript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import a11yEmoji from '@fec/remark-a11y-emoji';
import remarkFlexibleContainers from "remark-flexible-containers";
import remarkFlexibleParagraphs from "remark-flexible-paragraphs";
import remarkFrontmatter from 'remark-frontmatter'
import remarkDirective from "remark-directive";
import remarkTextr from 'remark-textr'
import remarkToc from 'remark-toc'
import sectionize from 'remark-sectionize'
import remarkIns from 'remark-ins'
import remarkSupersub from 'remark-supersub'
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";

// content.js - Integrated version with text transformations
// This version includes the text processing functions directly

// Language to Font Awesome icon mapping
const languageIcons = {
    javascript: 'fab fa-js-square',
    js: 'fab fa-js-square',
    typescript: 'fab fa-js-square',
    ts: 'fab fa-js-square',
    python: 'fab fa-python',
    py: 'fab fa-python',
    java: 'fab fa-java',
    php: 'fab fa-php',
    html: 'fab fa-html5',
    css: 'fab fa-css3-alt',
    scss: 'fab fa-sass',
    sass: 'fab fa-sass',
    less: 'fab fa-less',
    react: 'fab fa-react',
    jsx: 'fab fa-react',
    vue: 'fab fa-vuejs',
    angular: 'fab fa-angular',
    node: 'fab fa-node-js',
    nodejs: 'fab fa-node-js',
    npm: 'fab fa-npm',
    yarn: 'fab fa-yarn',
    docker: 'fab fa-docker',
    git: 'fab fa-git-alt',
    github: 'fab fa-github',
    gitlab: 'fab fa-gitlab',
    bitbucket: 'fab fa-bitbucket',
    go: 'fas fa-code',
    golang: 'fas fa-code',
    rust: 'fas fa-cog',
    cpp: 'fas fa-code',
    'c++': 'fas fa-code',
    c: 'fas fa-code',
    csharp: 'fas fa-code',
    'c#': 'fas fa-code',
    swift: 'fab fa-swift',
    kotlin: 'fas fa-code',
    ruby: 'fas fa-gem',
    rb: 'fas fa-gem',
    shell: 'fas fa-terminal',
    bash: 'fas fa-terminal',
    sh: 'fas fa-terminal',
    powershell: 'fas fa-terminal',
    sql: 'fas fa-database',
    mysql: 'fas fa-database',
    postgresql: 'fas fa-database',
    mongodb: 'fas fa-database',
    json: 'fas fa-file-code',
    xml: 'fas fa-code',
    yaml: 'fas fa-file-code',
    yml: 'fas fa-file-code',
    toml: 'fas fa-file-code',
    ini: 'fas fa-file-code',
    markdown: 'fab fa-markdown',
    md: 'fab fa-markdown',
    text: 'fas fa-file-alt',
    txt: 'fas fa-file-alt',
    default: 'fas fa-code'
};

// -----------------------------------------------------------------------------
// TEXT TRANSFORMATION FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Adds mark tags for highlighted text (==text==)
 */
function addMarkTags(text) {
    const markRegex = /==(.*?)==/g;
    return text.replace(markRegex, '<mark>$1</mark>');
}

/**
 * Adds superscript spans for ^text^
 */
function addSuperScript(text) {
    const superRegex = /\^(.*?)\^/g;
    return text.replace(superRegex, '<sup class="suptext">$1</sup>');
}

/**
 * Adds subscript spans for _-text-_
 */
function addSubScript(text) {
    const subRegex = /\_-(.*?)-\_/g;
    return text.replace(subRegex, '<sub class="subtext">$1</sub>');
}

/**
 * Applies all text transformations to text nodes while preserving HTML structure
 */
function applyTextTransformationsToTextNodes(element) {
    if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(element.tagName)) {
        return;
    }

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
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

    textNodes.forEach(textNode => {
        let content = textNode.textContent;
        const originalContent = content;
        
        // Apply transformations
        content = addMarkTags(content);
        content = addSuperScript(content);
        content = addSubScript(content);
        
        if (content !== originalContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            textNode.parentNode.replaceChild(fragment, textNode);
        }
    });
}

// -----------------------------------------------------------------------------
// MARKDOWN PROCESSING FUNCTIONS
// -----------------------------------------------------------------------------

// Helper function to traverse AST nodes
function visit(node, callback) {
    callback(node);
    if (node.children) {
        node.children.forEach(child => visit(child, callback));
    }
}

// Custom rehype plugin to add language icons to code blocks
function rehypeCodeLanguageIcons() {
    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'element' && node.tagName === 'pre') {
                const codeElement = node.children.find(child =>
                    child.type === 'element' && child.tagName === 'code'
                );

                if (codeElement && codeElement.properties && codeElement.properties.className) {
                    const languageClass = codeElement.properties.className.find(cls =>
                        cls.startsWith('language-')
                    );

                    if (languageClass) {
                        const language = languageClass.replace('language-', '').toLowerCase();
                        const iconClass = languageIcons[language] || languageIcons.default;

                        if (!node.properties) node.properties = {};
                        if (!node.properties.className) node.properties.className = [];
                        node.properties.className.push('has-language');
                        node.properties['data-language'] = language;

                        const languageIcon = {
                            type: 'element',
                            tagName: 'div',
                            properties: {
                                className: ['language-icon']
                            },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'i',
                                    properties: {
                                        className: iconClass.split(' '),
                                        title: language.toUpperCase()
                                    },
                                    children: []
                                }
                            ]
                        };

                        node.children.unshift(languageIcon);
                    }
                }
            }
        });
    };
}

function rehypeAdmonitions() {
    const admonitionTypes = ['note', 'tip', 'important', 'success', 'warning', 'caution', 'danger', 'error'];
    const admonitionIcons = {
        note: 'fas fa-info-circle',
        tip: 'fas fa-lightbulb',
        important: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        caution: 'fas fa-exclamation-triangle',
        danger: 'fas fa-skull-crossbones',
        error: 'fas fa-times-circle',
    };

    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'containerDirective') {
                const type = node.name.toLowerCase();
                if (admonitionTypes.includes(type)) {
                    node.type = 'element';
                    node.tagName = 'div';
                    node.properties = {
                        className: ['admonition', `admonition-${type}`]
                    };

                    const titleText = node.children[0]?.data?.value || type.charAt(0).toUpperCase() + type.slice(1);
                    const titleIconClass = admonitionIcons[type] || 'fas fa-info-circle';

                    const titleNode = {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: ['admonition-title'] },
                        children: [
                            {
                                type: 'element',
                                tagName: 'i',
                                properties: { className: titleIconClass.split(' ') },
                                children: []
                            },
                            {
                                type: 'text',
                                value: ` ${titleText}`,
                            }
                        ]
                    };
                    
                    const contentNode = {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: ['admonition-content'] },
                        children: node.children.slice(1)
                    };

                    node.children = [titleNode, contentNode];
                }
            }
        });
    };
}

// Simple ellipses plugin for remarkTextr
function ellipses(input) {
    return input.replace(/\.\.\./g, '…');
}

// Dynamic module loading function
async function loadModules() {
    try {
        const modules = await Promise.all([
            import('unified'),
            import('remark-parse'),
            import('remark-gfm'),
            import('remark-rehype'),
            import('rehype-highlight'),
            import('rehype-stringify'),
            import('@fec/remark-a11y-emoji'),
            import('remark-frontmatter'),
            import('remark-directive'),
            import('remark-textr'),
            import('remark-toc'),
            import('remark-sectionize'),
            import('remark-ins'),
            import('remark-supersub'),
            import('rehype-slug'),
            import('rehype-autolink-headings'),
            import('remark-github-admonitions-to-directives')
        ]);

        return {
            unified: modules[0].unified,
            remarkParse: modules[1].default,
            remarkGfm: modules[2].default,
            remarkRehype: modules[3].default,
            rehypeHighlight: modules[4].default,
            rehypeStringify: modules[5].default,
            a11yEmoji: modules[6].default,
            remarkFrontmatter: modules[7].default,
            remarkDirective: modules[8].default,
            remarkTextr: modules[9].default,
            remarkToc: modules[10].default,
            sectionize: modules[11].default,
            remarkIns: modules[12].default,
            remarkSupersub: modules[13].default,
            rehypeSlug: modules[14].default,
            rehypeAutolinkHeadings: modules[15].default,
            remarkGithubAdmonitionsToDirectives: modules[16].default
        };
    } catch (error) {
        console.error('Failed to load modules:', error);
        throw new Error('Could not load required markdown processing modules');
    }
}

async function renderMarkdown() {
    try {
        const preElement = document.querySelector("pre");
        if (!preElement || !preElement.textContent) {
            console.log("zysays: No markdown content found.");
            return;
        }

        const isMarkdownFile = window.location.pathname.endsWith(".md") || 
                              window.location.pathname.endsWith(".markdown") || 
                              window.location.pathname.endsWith(".mdown");
        if (!isMarkdownFile) {
            console.log("zysays: Not a markdown file.");
            return;
        }

        document.body.style.display = "none";
        
        // Show loading message
        document.body.innerHTML = `
            <div style="padding: 20px; font-family: "Zed Plex Sans", sans-serif; text-align: center;">
                <h2> Processing  </h2>
                <p>Please wait while the markdown modules are loaded.</p>
            </div>
        `;

        // Dynamically load all required modules
        const modules = await loadModules();
        
        const rawMarkdown = preElement.textContent;
        
        const processor = modules.unified()
            .use(modules.remarkParse)
            .use(modules.remarkGfm)
            .use(modules.remarkFrontmatter, ['yaml', 'toml'])
            .use(modules.remarkGithubAdmonitionsToDirectives)
            .use(modules.remarkDirective)
            .use(modules.remarkToc, { heading: 'toc|table[ -]of[ -]contents' })
            .use(modules.sectionize)
            .use(modules.remarkTextr, { plugins: [ellipses] })
            .use(modules.a11yEmoji)
            .use(modules.remarkIns)
            .use(modules.remarkSupersub)
            .use(modules.remarkRehype, { allowDangerousHtml: true })
            .use(modules.rehypeSlug)
            .use(modules.rehypeAutolinkHeadings, {
                behavior: 'prepend',
                properties: { className: ['heading-anchor-link'] },
                content: { type: 'text', value: '#' }
            })
            .use(modules.rehypeHighlight)
            .use(rehypeCodeLanguageIcons)
            .use(rehypeAdmonitions)
            .use(modules.rehypeStringify, { allowDangerousHtml: true });

        const file = await processor.process(rawMarkdown);
        const renderedHtml = String(file);

        if (window.stop) window.stop();

        const title = document.title || window.location.pathname.split("/").pop() || "Markdown Preview";

        document.documentElement.innerHTML = `
            <head>
                <meta charset="UTF-8">
                <link rel="shortcut-icon" type="image/png" href="${chrome.runtime.getURL("vite.svg")}"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
                <link rel="stylesheet" href="style.css" />
                <title>${title}</title>
            </head>
            <body>
                <div id="markdown-content-container">
                    ${renderedHtml}
                </div>
            </body>
        `;

        // Inject main stylesheet
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("style.css");
        document.head.appendChild(link);

        // Add interactive features
        addCodeCopyButtons();
        
        // Apply text transformations AFTER markdown processing
        setTimeout(() => {
            const contentContainer = document.querySelector('#markdown-content-container');
            if (contentContainer) {
                applyTextTransformationsToTextNodes(contentContainer);
                console.log('Text transformations applied successfully');
            }
        }, 100);

        document.body.style.display = "block";

    } catch (error) {
        console.error("Error rendering markdown:", error);
        document.body.style.display = "block";
        
        document.body.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Error Rendering Markdown</h2>
                <p>There was an error processing this markdown file:</p>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${error.message}</pre>
                <details style="margin-top: 10px;">
                    <summary>Technical Details</summary>
                    <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 12px;">${error.stack}</pre>
                </details>
            </div>
        `;
    }
}

function addCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach(block => {
        const codeElement = block.querySelector('code');
        if (!codeElement) return;

        const button = document.createElement('button');
        button.className = 'copy-code-button';
        button.innerHTML = '<i class="fas fa-copy"></i>';

        button.addEventListener('click', async () => {
            try {
                const codeToCopy = codeElement.innerText;
                await navigator.clipboard.writeText(codeToCopy);
                
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code: ', err);
                button.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            }
        });

        block.insertBefore(button, block.firstChild);
    });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMarkdown);
} else {
    renderMarkdown();
}
```

## `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [crx({ manifest })],
})
```

## `webpack.config.js`

```javascript
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    // Entry point for our content script
    entry: {
        content: "./src/content.js",
    },
    // Output configuration
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].bundle.js",
        clean: true, // Clean the dist folder before each build
    },
    // Plugins
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "public", to: "." }, // Copies files from public/ to dist/
            ],
        }),
    ],
    // Optional: configuration for resolving modules, etc.
    resolve: {
        extensions: [".js"],
    },
};
```


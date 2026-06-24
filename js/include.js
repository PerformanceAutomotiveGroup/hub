// =========================================================================
// 1. GLOBAL UTILITIES & PATH MANAGEMENT
// =========================================================================

/**
 * Dynamically determines the correct base path for the environment.
 * Ensures local testing (/) and GitHub Pages (/hub/) resolve accurately.
 */
function getNormalizedPath(targetPath) {
  const basePrefix = window.location.pathname.startsWith('/hub/') ? '/hub' : '';
  let cleanPath = targetPath;

  // Convert relative tracking (../../../) into an absolute root-relative format
  if (cleanPath.startsWith('../')) {
    cleanPath = cleanPath.replace(/^(\.\.\/)+/, '/');
  }

  // Ensure path is properly prefixed with the subfolder repository name if applicable
  if (!cleanPath.startsWith('http') && !cleanPath.startsWith(basePrefix)) {
    // Prevent double slashes during join
    if (basePrefix && !cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    cleanPath = basePrefix + cleanPath;
  }

  return cleanPath;
}

/**
 * Trims excessive outer indentation spaces common in multi-line template code blocks.
 */
function dedentCode(text) {
  const lines = text.split('\n');
  
  // Remove leading/trailing empty lines to clean boundaries
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  if (lines.length === 0) return '';

  // Calculate minimum indentation matching the first code element row
  const match = lines[0].match(/^[\s\t]*/);
  const minIndent = match ? match[0].length : 0;

  return lines
    .map(line => line.startsWith(lines[0].match(/^[\s\t]*/)[0]) ? line.slice(minIndent) : line)
    .join('\n');
}

// =========================================================================
// 2. CORE UTILITY INITIALIZATION ENGINE
// =========================================================================

/**
 * Injects HTML components asynchronously using custom data attributes.
 */
function loadIncludes(callback) {
  const elements = document.querySelectorAll('[data-include]');
  let loaded = 0;

  if (elements.length === 0 && callback) {
    return callback();
  }

  elements.forEach(el => {
    const rawFile = el.getAttribute('data-include');
    const processedFile = getNormalizedPath(rawFile);

    fetch(processedFile)
      .then(res => {
        if (!res.ok) throw new Error(`Could not fetch file reference: ${processedFile}`);
        return res.text();
      })
      .then(html => {
        el.innerHTML = html;
        loaded++;
        if (loaded === elements.length && callback) callback();
      })
      .catch(err => {
        el.innerHTML = `<p style="color:#d9534f; font-weight:bold; padding:10px;">Include Error: ${err.message}</p>`;
        // Increment anyway to ensure subsequent features aren't completely blocked
        loaded++;
        if (loaded === elements.length && callback) callback();
      });
  });
}

/**
 * Highlights active location within navigation layouts.
 */
function highlightActiveLink() {
  const currentPath = window.location.pathname;
  if (!currentPath) return;

  document.querySelectorAll('.sidenav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const linkPath = new URL(href, window.location.origin).pathname;
      if (currentPath === linkPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active'); 
      }
    }
  });
}

/**
 * Extracts raw template markup data, normalizes text alignments, and initializes Prism views.
 */
function initPrismTemplates() {
  document.querySelectorAll('template[id$="-template"]').forEach(template => {
    const baseId = template.id.replace('-template', '');
    const codeBlock = document.querySelector(`#${baseId}-code code`);

    if (codeBlock) {
      // Dedent content to preserve beautiful layout syntax tracking inside Prism containers
      codeBlock.textContent = dedentCode(template.innerHTML);
      if (window.Prism) {
        Prism.highlightElement(codeBlock);
      }
    }
  });
}

// =========================================================================
// 3. RUNTIME LIVE SANDBOX RENDERING UTILITIES
// =========================================================================

/**
 * Generates an isolated, sandboxed execution environment (iframe) for live previews.
 * This completely isolates template styling/scripts from breaking your Hub master UI.
 */
function renderLivePreview() {
  const previewContainer = document.getElementById('live-preview');
  const htmlTemplate = document.getElementById('html-template');
  const cssTemplate = document.getElementById('css-template');
  const jsTemplate = document.getElementById('js-template');

  if (!previewContainer || !htmlTemplate) return;

  previewContainer.innerHTML = ''; // Clear prior engine references

  // Create isolated sandbox frame
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.background = '#ffffff';
  iframe.style.borderRadius = '8px';
  iframe.style.minHeight = '300px';
  
  previewContainer.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  
  // Construct self-contained environment structural elements
  const htmlContent = htmlTemplate.innerHTML;
  const cssContent = cssTemplate ? `<style>${cssTemplate.innerHTML}</style>` : '';
  const jsContent = jsTemplate ? `<script>window.addEventListener('DOMContentLoaded', () => { ${jsTemplate.innerHTML} });<\/script>` : '';

  const iframeLayout = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${cssContent}
    </head>
    <body style="margin:0; padding:20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      ${htmlContent}
      ${jsContent}
    </body>
    </html>
  `.trim();

  iframeDoc.open();
  iframeDoc.write(iframeLayout);
  iframeDoc.close();

  // Automatically adjust iframe height container wrapper based on inner element footprint
  iframe.addEventListener('load', () => {
    setTimeout(() => {
      if (iframeDoc.body) {
        iframe.style.height = iframeDoc.body.scrollHeight + 40 + 'px';
      }
    }, 100);
  });
}

// =========================================================================
// 4. INTERACTION MANAGERS & EVENT CONTROLLERS
// =========================================================================

function initCopyButtons() {
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering open/close container accordions toggling
      const id = btn.getAttribute('data-copy');
      const code = document.querySelector(`#${id} code`)?.textContent;
      if (!code) return;

      navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = originalText), 1500);
      });
    });
  });

  const copyAllBtn = document.querySelector('[data-copy-all]');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const html = document.querySelector('#html-code code')?.textContent || '';
      const css  = document.querySelector('#css-code code')?.textContent || '';
      const js   = document.querySelector('#js-code code')?.textContent || '';

      const combinedFileLayout = `
${html}

<style>
${css}
</style>

<script>
${js}
<\/script>
`.trim();

      navigator.clipboard.writeText(combinedFileLayout).then(() => {
        copyAllBtn.textContent = 'All Layout Modules Copied!';
        setTimeout(() => (copyAllBtn.textContent = 'Copy All'), 2000);
      });
    });
  }
}

function initCollapsibleCode() {
  document.querySelectorAll('.template-code-block .toggle-btn').forEach(header => {
    header.addEventListener('click', () => {
      const block = header.closest('.template-code-block');
      block.classList.toggle('open');
    });
  });
}

window.executeTopNavSearch = function() {
    const query = document.getElementById('topnav-search-input').value.toLowerCase().trim();
    
    const dashboardResultContainer = document.getElementById('search-results');
    
    if (dashboardResultContainer) {
        const homeSearchInput = document.getElementById('search-input');
        if (homeSearchInput) {
            homeSearchInput.value = query;
            if (typeof performSearch === "function") performSearch();
        }
    } else {
        if (event.key === 'Enter' && query.length > 0) {
            sessionStorage.setItem('hubSearchQuery', query);
            window.location.href = '/hub/index.html';
        }
    }
};

// Auto-run on homepage DOM load to catch external deep page redirections
document.addEventListener('DOMContentLoaded', () => {
    const savedQuery = sessionStorage.getItem('hubSearchQuery');
    const homeSearchInput = document.getElementById('search-input');
    if (savedQuery && homeSearchInput) {
        sessionStorage.removeItem('hubSearchQuery');
        homeSearchInput.value = savedQuery;
        if (typeof performSearch === "function") performSearch();
    }
});

// =========================================================================
// 5. APPARATUS EXECUTION LIFECYCLE INITIALIZER
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadIncludes(() => {
    highlightActiveLink();
    initPrismTemplates();
    initCopyButtons();
    renderLivePreview();
    initCollapsibleCode();
  });
});

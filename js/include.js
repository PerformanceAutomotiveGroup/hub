// ===============================
// HTML Includes with Path Correction
// ===============================
function loadIncludes(callback) {
  const elements = document.querySelectorAll('[data-include]');
  let loaded = 0;

  if (elements.length === 0 && callback) callback();

  // Determine if running on GitHub Pages subfolder vs local root
  const basePrefix = window.location.pathname.startsWith('/hub/') ? '/hub' : '';

  elements.forEach(el => {
    let file = el.getAttribute('data-include');
    
    // Convert relative paths to absolute root paths dynamically
    if (file.startsWith('../')) {
      file = file.replace(/^(\.\.\/)+/, '/');
    }
    if (!file.startsWith('http') && !file.startsWith(basePrefix)) {
      file = basePrefix + file;
    }

    fetch(file)
      .then(res => {
        if (!res.ok) throw new Error(`Could not fetch ${file}`);
        return res.text();
      })
      .then(html => {
        el.innerHTML = html;
        loaded++;
        if (loaded === elements.length && callback) callback();
      })
      .catch(err => {
        el.innerHTML = `<p style="color:red;">Include error: ${err.message}</p>`;
      });
  });
}

// ===============================
// Active Sidenav Highlight
// ===============================
function highlightActiveLink() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidenav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.split('/').pop() === currentPage) {
      link.classList.add('active');
    }
  });
}

// ===============================
// Prism Template Loader (Standardized)
// ===============================
function initPrismTemplates() {
  document.querySelectorAll('template[id$="-template"]').forEach(template => {
    const baseId = template.id.replace('-template', '');
    const codeBlock = document.querySelector(`#${baseId}-code code`);

    if (codeBlock) {
      // Safely grab innerHTML and clean up whitespace
      codeBlock.textContent = template.innerHTML.trim();
      if (window.Prism) {
        Prism.highlightElement(codeBlock);
      }
    }
  });
}

// ===============================
// Copy Buttons (HTML / CSS / JS)
// ===============================
function initCopyButtons() {
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop code collapse from firing on click
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

  // Copy ALL Combined Component Code
  const copyAllBtn = document.querySelector('[data-copy-all]');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const html = document.querySelector('#html-code code')?.textContent || '';
      const css  = document.querySelector('#css-code code')?.textContent || '';
      const js   = document.querySelector('#js-code code')?.textContent || '';

      const combined = `\n${html}\n\n\n<style>\n${css}\n</style>\n\n\n<script>\n${js}\n<\/script>`.trim();

      navigator.clipboard.writeText(combined).then(() => {
        copyAllBtn.textContent = 'All Copied!';
        setTimeout(() => (copyAllBtn.textContent = 'Copy All'), 2000);
      });
    });
  }
}

// ===============================
// Render Live Preview (HTML + CSS + JS)
// ===============================
function renderLivePreview() {
  const previewContainer = document.getElementById('live-preview');
  const htmlTemplate = document.getElementById('html-template');
  const cssTemplate = document.getElementById('css-template');
  const jsTemplate = document.getElementById('js-template');

  if (previewContainer && htmlTemplate) {
    previewContainer.innerHTML = ''; // Clear container

    // Inject HTML
    const clone = htmlTemplate.content.cloneNode(true);
    previewContainer.appendChild(clone);

    // Inject CSS if present
    if (cssTemplate) {
      const styleEl = document.createElement('style');
      styleEl.textContent = cssTemplate.innerHTML.trim();
      previewContainer.appendChild(styleEl);
    }

    // Inject JS if present
    if (jsTemplate) {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = jsTemplate.innerHTML.trim();
      previewContainer.appendChild(scriptEl);
    }
  }
}

// ===============================
// Collapsible Code Sections
// ===============================
function initCollapsibleCode() {
  document.querySelectorAll('.template-code-block .toggle-btn').forEach(header => {
    header.addEventListener('click', () => {
      const block = header.closest('.template-code-block');
      block.classList.toggle('open');
    });
  });
}

// ===============================
// Initialize Everything
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  loadIncludes(() => {
    highlightActiveLink();
    initPrismTemplates();
    initCopyButtons();
    renderLivePreview();
    initCollapsibleCode();
  });
});

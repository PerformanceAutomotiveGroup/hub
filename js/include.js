// ===============================
// HTML Includes
// ===============================
function loadIncludes(callback) {
  const elements = document.querySelectorAll('[data-include]');
  let loaded = 0;

  if (elements.length === 0 && callback) callback();

  elements.forEach(el => {
    const file = el.getAttribute('data-include');
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
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// ===============================
// Prism Template Loader
// ===============================
function initPrismTemplates() {
  document.querySelectorAll('template[id$="-template"]').forEach(template => {
    const baseId = template.id.replace('-template', '');
    const codeBlock = document.getElementById(`${baseId}-snippet`);
    if (codeBlock) {
      codeBlock.textContent = template.innerHTML.trim();
      Prism.highlightElement(codeBlock);
    }
  });
}

// ===============================
// Copy Buttons
// ===============================
function initPrismTemplates() {
  document.querySelectorAll('section.template-code-block').forEach(block => {
    const template = block.querySelector('template');
    const codeEl = block.querySelector('pre code');

    if (template && codeEl) {
      codeEl.textContent = template.innerHTML.trim(); // Prism gets highlighted text
      Prism.highlightElement(codeEl);
    }
  });
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('section.template-code-block');
      const template = block.querySelector('template');

      if (!template) return;

      const code = template.innerHTML.trim(); // raw HTML from template
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      });
    });
  });

  // Copy All
  const copyAllBtn = document.querySelector('[data-copy-all]');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const htmlTemplate = document.querySelector('#html-code template');
      const cssCode  = document.querySelector('#css-code code')?.textContent || '';
      const jsCode   = document.querySelector('#js-code code')?.textContent || '';

      const html = htmlTemplate ? htmlTemplate.innerHTML.trim() : '';

      const combined = `
<!-- HTML -->
${html}

<!-- CSS -->
<style>
${cssCode}
</style>

<!-- JS -->
<script>
${jsCode}
<\/script>
      `.trim();

      navigator.clipboard.writeText(combined).then(() => {
        copyAllBtn.textContent = 'All Copied!';
        setTimeout(() => (copyAllBtn.textContent = 'Copy All'), 2000);
      });
    });
  }
}



// ===============================
// Init Everything
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  loadIncludes(() => {
    highlightActiveLink();
    initPrismTemplates();
    initCopyButtons();
  });
});

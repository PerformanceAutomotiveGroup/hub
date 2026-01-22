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
function decodeHtmlEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function initCopyButtons() {
  // Individual copy
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-copy');
      const codeEl = document.querySelector(`#${id} code`);
      if (!codeEl) return;

      let code = codeEl.textContent;

      // Decode HTML entities only for HTML section
      if (id === 'html-code') code = decodeHtmlEntities(code);

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
      let html = document.querySelector('#html-code code')?.textContent || '';
      let css  = document.querySelector('#css-code code')?.textContent || '';
      let js   = document.querySelector('#js-code code')?.textContent || '';

      html = decodeHtmlEntities(html); // decode HTML section

      const combined = `
<!-- HTML -->
${html}

<!-- CSS -->
<style>
${css}
</style>

<!-- JS -->
<script>
${js}
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

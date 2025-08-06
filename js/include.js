function includeHTML() {
  const elements = document.querySelectorAll("[data-include]");
  elements.forEach(el => {
    const file = el.getAttribute("data-include");
    fetch(file)
      .then(res => {
        if (!res.ok) throw new Error(`Could not fetch ${file}`);
        return res.text();
      })
      .then(data => {
        el.innerHTML = data;
      })
      .catch(err => {
        el.innerHTML = `<p style="color:red;">Include error: ${err.message}</p>`;
      });
  });
}

document.addEventListener("DOMContentLoaded", includeHTML);

// ---------- Prism Code Snippet Loader ----------
document.querySelectorAll('template[id$="-template"]').forEach(template => {
  const baseId = template.id.replace('-template', '');
  const codeBlock = document.getElementById(`${baseId}-snippet`);
  
  if (codeBlock) {
    codeBlock.textContent = template.innerHTML.trim();
    Prism.highlightElement(codeBlock);
  }
});


// ---------- Copy to Clipboard ----------
function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const textarea = document.createElement('textarea');
  textarea.value = el.textContent;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    alert('Code copied!');
  } catch (err) {
    alert('Failed to copy code.');
  }
  document.body.removeChild(textarea);
}

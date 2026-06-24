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
* This completely isolates template styling/scripts from breaking Hub master UI.
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

// =========================================================================
// 4.5 CENTRALIZED SEARCH APPLICATION CONTROLLER 
// =========================================================================

// 1. Centralized Search Database Index Registry (Keep this intact)
const searchDatabase = [
{ name: "HTML Home / Overview Dashboard", url: "/hub/pages/HTML/index.html", keywords: "html structure index guide overview chapter main hub library" },
{ name: "CSS Home / Overview Dashboard", url: "/hub/pages/CSS/index.html", keywords: "css styles presentation index layout framework typography variables presentation design main hub library" },
{ name: "JavaScript Home / Overview Dashboard", url: "/hub/pages/JS/index.html", keywords: "js javascript behaviour interaction code programming scripts index main hub library" },
{ name: "Bootstrap Component Library Hub", url: "/hub/pages/BOOTSTRAP/index.html", keywords: "bootstrap bootstarp layout elements responsive framework grid columns utility elements main hub library" },
{ name: "WordPress Reusable Layout Templates", url: "/hub/pages/TEMPLATES/index.html", keywords: "templates full layout wordpress conversions compositions framework theme page design blueprints main hub library" },
{ name: "More Utilities & Optimization Toolkit", url: "/hub/pages/MORE/index.html", keywords: "more extras seo meta tags accessibility optimization helper tools main hub library" },
{ name: "HTML Chapter: Basic Elements Index", url: "/hub/pages/HTML/basic-elements/index.html", keywords: "html chapter basic elements headings text paragraph document rules structural typography index" },
{ name: "HTML Chapter: Forms & Lead Capture Index", url: "/hub/pages/HTML/forms/index.html", keywords: "html chapter forms user intake lead capture input layouts structures interface validation index" },
{ name: "HTML Chapter: Galleries & Media Index", url: "/hub/pages/HTML/galleries/index.html", keywords: "html chapter galleries media responsive layout image swap lightbox sliding grid arrays index" },
{ name: "HTML Chapter: Interactive Maps Index", url: "/hub/pages/HTML/maps/index.html", keywords: "html chapter interactive maps absolute scale coordinates hotspot graphic boundary tracking overlay index" },
{ name: "CSS Chapter: Interactive Toggles & States Index", url: "/hub/pages/CSS/toggles-states/index.html", keywords: "css chapter interactive toggles states element selection click reveal hover navigation display index" },
{ name: "JavaScript Chapter: UI Controls & Toggles Index", url: "/hub/pages/JS/ui-controls/index.html", keywords: "js javascript chapter ui controls toggles operational panel menu draw accordion alerts popup index" },
{ name: "Templates Chapter: Campaign Landing Pages Index", url: "/hub/pages/TEMPLATES/landing-pages/index.html", keywords: "templates chapter landing pages marketing funnels assembly wireframe layout blueprints corporate index" },
{ name: "HTML Trader Form Component", url: "/hub/pages/HTML/forms/html-form.html", keywords: "html form trader lead capture input form user intake layout matrix validation structure" },
{ name: "HTML Image Maps Documentation", url: "/hub/pages/HTML/maps/html-map.html", keywords: "html image maps coordinate area click geometry responsive absolute hotspot scale overlay boundary" },
{ name: "HTML Image Swap System", url: "/hub/pages/HTML/galleries/html-imageswap.html", keywords: "html image swap hover change picture src transition resolution dynamic cropping viewport query" },
{ name: "HTML Responsive Image Gallery", url: "/hub/pages/HTML/galleries/html-imagegallery.html", keywords: "html image gallery thumbnail responsiveness portfolio grid view layout matrix scale hover transition" },
{ name: "HTML Lightbox Overlay Gallery", url: "/hub/pages/HTML/galleries/html-lightbox-gallery.html", keywords: "html lightbox modal gallery overlay image popup click fullscreen sequential slideshow index array caption" },
{ name: "CSS Interactive Element On-click", url: "/hub/pages/CSS/toggles-states/css-element-on-click.html", keywords: "css element on click hide show target panel toggle function display active criteria layout visibility state" },
{ name: "CSS Hoverable Navigation Dropdown", url: "/hub/pages/CSS/toggles-states/css-hover-dropdown.html", keywords: "css hover dropdown absolute responsive child select menu display question answer nested alignment submenu link" },
{ name: "Basic Conversion Marketing Landing Page", url: "/hub/pages/TEMPLATES/landing-pages/landing-page-basic.html", keywords: "landing page blueprint basic campaign performance hero grid modules template layout wireframe container scaffolding" },
{ name: "Immersive Performance Experience Blueprint", url: "/hub/pages/TEMPLATES/landing-pages/performance-experience-page.html", keywords: "templates immersive campaign full experience video streaming media display tab navigation layout layered content framework" },
{ name: "Interactive E-Commerce Car Shopping Page", url: "/hub/pages/TEMPLATES/landing-pages/performance-car-shopping.html", keywords: "templates high-fidelity layout digital campaign car shopping pathway timeline route filtering multi brand selection checkbox matrix array console toast notification inline video" },
{ name: "Corporate About Showcase Blueprint", url: "/hub/pages/TEMPLATES/landing-pages/performance-about.html", keywords: "templates corporate about showcase layout informational stat counter analytics metrics scroll track loop infinite brand slider carousel layout pillars grid blocks section" }
];

// 2. Main Execution Runtime Logic
window.initGlobalSearchEngine = function() {
const currentPath = window.location.pathname;
const isHomepage = currentPath === '/hub/' || currentPath === '/hub/index.html';

const searchInput = isHomepage ? document.getElementById('hub-search') : document.getElementById('topnav-search-input');
const resultsBox = isHomepage ? document.getElementById('search-results-box') : document.getElementById('topnav-search-results-box');
const topNavSearchBlock = document.getElementById('topnav-search-block');

if (topNavSearchBlock) {
topNavSearchBlock.style.display = isHomepage ? 'none' : 'block';
}

if (!searchInput || !resultsBox) return;

// FIX: Core event listener management function
const processQuery = () => {
const value = searchInput.value.toLowerCase().trim();

if (!value) {
resultsBox.innerHTML = '';
resultsBox.style.display = 'none';
return;
}

const matches = searchDatabase.filter(item => 
item.name.toLowerCase().includes(value) || 
item.keywords.toLowerCase().includes(value)
);

if (matches.length > 0) {
resultsBox.innerHTML = matches.map(item => `
<a href="${item.url}" style="display:block; padding:12px; border-bottom:1px solid #f1f5f9; text-decoration:none; color:#1e293b;">
<strong>${item.name}</strong><br/>
<span style="font-size:0.8em; color:#64748b;">Path: ${item.url}</span>
</a>
`).join('');
} else {
resultsBox.innerHTML = '<div style="padding:12px; color:#64748b; font-size:14px;">No matching assets found...</div>';
}

resultsBox.style.display = 'block';
};

// FIX: Safely attach the event loop directly to the homepage input element if it lacks an inline tracker attribute
if (isHomepage && !searchInput.hasAttribute('data-search-bound')) {
searchInput.addEventListener('input', processQuery);
searchInput.setAttribute('data-search-bound', 'true');
} else if (!isHomepage) {
// Run immediately for topnav keyup actions
processQuery();
}

// Outer click dismiss handling
document.addEventListener('click', (e) => {
if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
resultsBox.style.display = 'none';
}
});
};

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

// Fire search bar visibility checking routine safely immediately on layout finish
initGlobalSearchEngine();
});
});

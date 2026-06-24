// 1. Centralized Search Database Index Registry
const searchDatabase = [
// MAIN CATEGORY TIERS
{ name: "HTML Home / Overview Dashboard", url: "/hub/pages/HTML/index.html", keywords: "html structure index guide overview chapter main hub library" },
{ name: "CSS Home / Overview Dashboard", url: "/hub/pages/CSS/index.html", keywords: "css styles presentation index layout framework typography variables presentation design main hub library" },
{ name: "JavaScript Home / Overview Dashboard", url: "/hub/pages/JS/index.html", keywords: "js javascript behaviour interaction code programming scripts index main hub library" },
{ name: "Bootstrap Component Library Hub", url: "/hub/pages/BOOTSTRAP/index.html", keywords: "bootstrap bootstrap layout elements responsive framework grid columns utility elements main hub library" },
{ name: "WordPress Reusable Layout Templates", url: "/hub/pages/TEMPLATES/index.html", keywords: "templates full layout wordpress conversions compositions framework theme page design blueprints main hub library" },
{ name: "More Utilities & Optimization Toolkit", url: "/hub/pages/MORE/index.html", keywords: "more extras seo meta tags accessibility optimization helper tools main hub library" },

// SUB-CATEGORY CHAPTER DASHBOARDS
{ name: "HTML Chapter: Basic Elements Index", url: "/hub/pages/HTML/basic-elements/index.html", keywords: "html chapter basic elements headings text paragraph document rules structural typography index" },
{ name: "HTML Chapter: Forms & Lead Capture Index", url: "/hub/pages/HTML/forms/index.html", keywords: "html chapter forms user intake lead capture input layouts structures interface validation index" },
{ name: "HTML Chapter: Galleries & Media Index", url: "/hub/pages/HTML/galleries/index.html", keywords: "html chapter galleries media responsive layout image swap lightbox sliding grid arrays index" },
{ name: "HTML Chapter: Interactive Maps Index", url: "/hub/pages/HTML/maps/index.html", keywords: "html chapter interactive maps absolute scale coordinates hotspot graphic boundary tracking overlay index" },
{ name: "CSS Chapter: Interactive Toggles & States Index", url: "/hub/pages/CSS/toggles-states/index.html", keywords: "css chapter interactive toggles states element selection click reveal hover navigation display index" },
{ name: "JavaScript Chapter: UI Controls & Toggles Index", url: "/hub/pages/JS/ui-controls/index.html", keywords: "js javascript chapter ui controls toggles operational panel menu draw accordion alerts popup index" },
{ name: "Templates Chapter: Campaign Landing Pages Index", url: "/hub/pages/TEMPLATES/landing-pages/index.html", keywords: "templates chapter landing pages marketing funnels assembly wireframe layout blueprints corporate index" },

// CORE CODE SNIPPETS & PAGE COMPOSITIONS
{ name: "HTML Trader Form Component", url: "/hub/pages/HTML/forms/html-form.html", keywords: "html form trader lead capture input form user intake layout matrix validation structure" },
{ name: "HTML Image Maps Documentation", url: "/hub/pages/HTML/maps/html-map.html", keywords: "html image maps coordinate area click geometry responsive absolute hotspot scale overlay boundary" },
{ name: "HTML Image Swap System", url: "/hub/pages/HTML/galleries/html-imageswap.html", keywords: "html image swap hover change picture src transition resolution dynamic cropping viewport query" },
{ name: "HTML Responsive Image Gallery", url: "/hub/pages/HTML/galleries/html-imagegallery.html", keywords: "html image gallery thumbnail responsiveness portfolio grid view layout matrix scale hover transition" },
{ name: "HTML Lightbox Overlay Gallery", url: "/hub/pages/HTML/galleries/html-lightbox-gallery.html", keywords: "html lightbox modal gallery overlay image popup click fullscreen sequential slideshow index array caption" },
{ name: "CSS Interactive Element On-click", url: "/hub/pages/CSS/toggles-states/css-element-on-click.html", keywords: "css element on click hide show target panel toggle function display active criteria layout visibility state" },
{ name: "CSS Hoverable Navigation Dropdown", url: "/hub/pages/CSS/toggles-states/css-hover-dropdown.html", keywords: "css hover dropdown absolute responsive child select menu display question answer nested alignment submenu link" },
{ name: "Basic Conversion Marketing Landing Page", url: "/hub/pages/TEMPLATES/landing-pages/landing-page-basic.html", keywords: "landing page blueprint basic campaign performance hero grid modules template layout wireframe container scaffolding" },
{ name: "Immersive Performance Experience Blueprint", url: "/hub/pages/TEMPLATES/landing-pages/performance-experience-page.html", keywords: "templates immersive campaign full experience video streaming media display tab navigation layout layered content framework" },
{ name: "Interactive E-Commerce Car Shopping Page", url: "/hub/pages/TEMPLATES/landing-pages/performance-car-shopping.html", keywords: "templates high-fidelity layout digital campaign car shopping pathway timeline route filtering multi-brand selection checkbox matrix array console toast notification inline video" },
{ name: "Corporate About Showcase Blueprint", url: "/hub/pages/TEMPLATES/landing-pages/performance-about.html", keywords: "templates corporate about showcase layout informational stat counter analytics metrics scroll track loop infinite brand slider carousel layout pillars grid blocks section" }
];

// 2. Global Execution Routine Wrapper
window.initGlobalSearchEngine = function() {
const currentPath = window.location.pathname;
const isHomepage = currentPath === '/hub/' || currentPath === '/hub/index.html';

// Target inputs dynamically based on page location context
const searchInput = isHomepage ? document.getElementById('hub-search') : document.getElementById('topnav-search-input');
const resultsBox = isHomepage ? document.getElementById('search-results-box') : document.getElementById('topnav-search-results-box');
const topNavSearchBlock = document.getElementById('topnav-search-block');

// Toggle Top Nav Input Visibility on Homepage Layouts
if (topNavSearchBlock) {
topNavSearchBlock.style.display = isHomepage ? 'none' : 'block';
}

// Safety Abort if elements aren't present in current template context
if (!searchInput || !resultsBox) return;

// Remove any stale listeners before applying fresh ones
searchInput.removeAttribute('data-search-bound');

// Bind Real-Time Entry Processing
searchInput.addEventListener('input', () => {
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
<a href="${item.url}" class="search-result-item" style="display:block; padding:8px; border-bottom:1px solid #eee; text-decoration:none; color:#333;">
<strong>${item.name}</strong><br/>
<span style="font-size:0.8em; color:#777;">Path: ${item.url}</span>
</a>
`).join('');
} else {
resultsBox.innerHTML = '<div class="no-results" style="padding:8px; color:#777;">No documentation matching snippet query found...</div>';
}

resultsBox.style.display = 'block';
});

// Outer-Click Dropdown Structural Dismissal Engine
document.addEventListener('click', (e) => {
if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
resultsBox.style.display = 'none';
}
});
};

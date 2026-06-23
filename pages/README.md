# Pages Directory

The `pages/` directory contains all documentation, examples, and layout patterns presented within the Performance Hub.

Everything in this directory is intended to be **browsed, learned from, and referenced**.  

---

## Purpose of `pages/`

- Document common web codes and approaches
- Provide clear, visual examples
- Capture repeatable solutions used across projects
- Serve as a shared learning resource for the team

---

## Directory Structure

The directory is organized into a scalable, chapter-based multi-tier architecture:

pages/
├── HTML/ → Core markup patterns subdivided into topic chapters (basic-elements, forms, galleries, maps)
├── CSS/ → Styling, global root variables, layouts, and presentation interactions (toggles-states)
├── JS/ → JavaScript client-side behaviour and programmatic logic examples (ui-controls)
├── BOOTSTRAP/ → Framework-specific layout utilities and utility grid blocks
├── TEMPLATES/ → Complete, production-ready full-page layout compositions (landing-pages)
└── MORE/ → Advanced topics, tracking headers, performance optimization, and accessibility rules

---

## Chapter & Folder Guidelines

### HTML/
- Focuses on structure, semantics, and raw markup building blocks.
- **Chapter Breakdown:** Form structures (`forms/`), image layout arrays (`galleries/`), tracking boundary fields (`maps/`), and foundational block configurations (`basic-elements/`).
- Avoids styling variables beyond what is completely necessary for component layout clarity.

---

### CSS/
- Demonstrates visual patterns, responsive adjustments, and presentation interactions.
- **Chapter Breakdown:** Structural layout element display states, hover transitions, and dropdown rules are anchored inside `toggles-states/`.

---

### JS/
- Contains isolated JavaScript-driven interactions, DOM parameter modification, and client validation logic.
- **Chapter Breakdown:** Operational slide-out draws, alert overlays, and toggle elements are anchored inside `ui-controls/`.

---

### BOOTSTRAP/
- Documents Bootstrap-specific components and utility grid applications within internal workflows.
- Avoids duplicating generic Bootstrap documentation—focuses entirely on PAG deployment constraints.

---

### TEMPLATES/
- Contains **full-page macro layout compositions** (not individual building block components).
- Combines HTML, CSS, and JS patterns into cohesive, real-world examples.
- **Chapter Breakdown:** E-Commerce landing pages, informational corporate overviews, and wireframes live inside `landing-pages/`.

---

### MORE/
- Used for advanced, uncommon, or transitional topics (SEO headers, accessibility attributes, lazy-loading hacks).
- Serves as a holding area for tracking content that does not yet have a dedicated chapter home.

---

## Technical Routing & Coding Rules

- **Absolute Root Pathing:** Never utilize relative links (`../../`) anywhere in these files. All assets, including stylesheets and navigation data dependencies, must map directly to the root-relative path (`/hub/`).
- **Sandbox Compliance:** Every element snippet page must encapsulate code within specific `<template id="html-template">`, `<template id="css-template">`, and `<template id="js-template">` tags so the live preview container can render them safely.
- **Grammar Restraints:** Do not write or format documentation copy using em-dashes or en-dashes.
- **Prohibited Words:** To maintain a crisp technical voice, avoid fluff verbs such as *harness*, *leverage*, *empower*, or *unleash* anywhere in this directory's files.

---

## Naming & Organization Rules

- Use clear, lowercase, descriptive filenames separated exclusively by hyphens (e.g., `trader-contact-form.html`).
- Avoid generic, low-value naming variants like `test.html` or `example.html`.
- Always group sub-components into their specific chapter directory folder layout tier.

---

## When to Add Something New

Add a new page when:
- A pattern has been verified and deployed across projects more than once.
- A technical solution needs to be documented to enforce structural design consistency.
- **Synchronize Search:** You **must** add your file's configuration data block directly into the master `searchDatabase` array whenever adding an entry to maintain global dashboard search visibility.

---

## Maintenance

The `pages/` directory should remain organized, relevant, and aligned with real project needs. Outdated or legacy-style rules must be revised or deleted immediately to protect documentation clarity.

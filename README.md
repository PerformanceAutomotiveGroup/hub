# Performance Hub

The Performance Hub is an internal reference for web layouts, UI patterns, and approved page compositions used across Performance Auto Group projects.

It exists to improve consistency, speed, and clarity when designing, building, or reviewing web pages and features.

---

## What This Is

- A centralized, chapter-based learning and reference hub  
- A collection of approved HTML, CSS, JavaScript, and layout patterns  
- A shared source of truth for common web solutions  
- A place to document repeatable approaches used across projects  

---

## What This Is Not

- A production codebase  
- A WordPress theme or plugin  
- A page builder or automation system  
- A drop-in framework  

Templates and examples are **reference implementations** and starting points, not finished or installable products.

---

## Folder Overview

hub/
├── css/ → Shared styles used by the hub itself
├── images/ → Screenshots, visual references and brand logos
├── js/ → Shared scripts used by the hub (including search database)
├── nav/ → Centralized navigation fragments and master head files
├── pages/ → Chapter documentation, index dashboards, and templates
└── index.html → Hub global search entry dashboard

---

## Pages Structure

The `pages/` directory is organized into a multi-tier chapter architecture to allow endless scalability:

pages/
├── HTML/ → Core markup patterns, subdivided by chapters (basic-elements, forms, galleries, maps)
├── CSS/ → Styling, root variables, layouts, and interactive transition states (toggles-states)
├── JS/ → Behaviour and logic examples (ui-controls)
├── BOOTSTRAP/ → Framework-specific responsive grids and component usage
├── TEMPLATES/ → Full-page layout compositions (landing-pages)
└── MORE/ → Advanced topics, SEO meta headers, performance tips, and accessibility rules

### Key Distinction

- **HTML / CSS / JS** folders contain *building blocks* grouped into specific topic chapters  
- **TEMPLATES** contains *assembled page layouts* built from those blocks  

---

## Templates

Templates represent **full-page compositions** (not individual components).

They are intended to:
- Demonstrate approved layout code
- Combine multiple HTML, CSS, and JS concepts
- Act as starting points for landing pages 

### Active Productions:
- **E-Commerce Car Shopping Page** (`/pages/TEMPLATES/landing-pages/performance-car-shopping.html`): High-fidelity digital path filtering dashboard and brand selector array.
- **Corporate About Showcase Blueprint** (`/pages/TEMPLATES/landing-pages/performance-about.html`): Informational layout tracking stat counters, automated brand slider loops, and value pillars.
- **Basic Wireframe Structure** (`/pages/TEMPLATES/landing-pages/landing-page-basic.html`): Clean baseline container landing grid.

---

## Critical Code Guidelines

- **Root-Relative Paths Only:** Because the hub relies on deep subfolders, you must avoid relative pathing loops (`../../`). Use absolute paths (`/hub/nav/...`) for all inclusions and assets to prevent dead links on static hosting networks.
- **Strict Grammar Standards:** Do not use em-dashes or en-dashed formatting inside documentation strings. 
- **Prohibited Terminology:** To keep our style guide direct and professional, strictly avoid fluff verbs like *harness*, *leverage*, *empower*, or *unleash* in any reference copy or template structures.

---

## How to Use This Hub

- **Learning:** Browse structured chapters to understand layout configurations  
- **Reference:** Revisit established code blocks and interactions used before  
- **Consistency:** Align new work with existing development standards  
- **Onboarding:** Help new team members ramp up on our front-end protocols faster  

---

## Contributions

When adding new content:
- Place examples inside their correct sub-category chapter folder (e.g., forms inside `pages/HTML/forms/`).
- Isolate the code inside unique template nodes (`<template id="html-template">`), so the live preview sandbox can parse them seamlessly.
- Avoid duplicating existing design patterns.
- **Update Search Index:** You must update the master `searchDatabase` array whenever adding or re-routing a page to maintain global discoverability.

---

## Ownership & Maintenance

This hub is maintained internally to support Performance Automotive Group projects.  
Content should remain practical, intentional, and aligned with use cases.

If a code  is no longer relevant, it should be updated or removed immediately.

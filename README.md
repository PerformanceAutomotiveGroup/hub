# Performance Hub

The Performance Hub is an internal reference for web layouts, UI patterns, and approved page compositions used across Performance Auto Group projects.

It exists to improve consistency, speed, and clarity when designing, building, or reviewing web pages and features.

---

## What This Is

- A centralized learning and reference hub  
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
├── images/ → Screenshots and visual references
├── js/ → Shared scripts used by the hub
├── nav/ → Navigation and layout partials
├── pages/ → Documentation, examples, and templates
└── index.html → Hub landing page

---

## Pages Structure

The `pages/` directory is organized by purpose:

pages/
├── HTML → Core markup patterns and examples
├── CSS → Styling and interaction patterns
├── JS → Behaviour and logic examples
├── BOOTSTRAP → Framework-specific usage
├── TEMPLATES → Full-page layout compositions
└── MORE → Advanced or edge-case topics

### Key Distinction

- **HTML / CSS / JS** folders contain *building blocks*  
- **TEMPLATES** contains *assembled page layouts* built from those blocks  

---

## Templates

Templates represent **full-page compositions** (not individual components).

They are intended to:
- Demonstrate approved layout patterns
- Combine multiple HTML, CSS, and JS concepts
- Act as starting points for pages

Templates should:
- Be clear and readable
- Avoid one-off hacks or experimental code
- Reflect best practices already documented elsewhere in the hub

---

## How to Use This Hub

- **Learning:** Browse examples to understand patterns and approaches  
- **Reference:** Revisit layouts and interactions used before  
- **Consistency:** Align new work with existing standards  
- **Onboarding:** Help new team members ramp up faster  

---

## Contributions

When adding new content:
- Place examples in the correct folder
- Use clear, descriptive filenames
- Avoid duplicating existing patterns
- Keep explanations concise and practical

If something does not clearly fit, it probably belongs in `MORE` until its purpose is defined.

---

## Ownership & Maintenance

This hub is maintained internally to support Performance Automotive Group projects.  
Content should remain practical, intentional, and aligned with use cases.

If a pattern is no longer relevant, it should be updated or removed.

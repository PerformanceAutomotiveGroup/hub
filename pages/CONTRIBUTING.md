# Contributing to Performance Hub

Thank you for helping improve the Performance Hub.  
This repository exists to document repeatable web patterns and layout approaches used across Performance Auto Group projects.

Keep contributions clear, practical, and intentional.

---

## Before You Add Something

Ask yourself:
- Has this pattern been used more than once?
- Will someone else benefit from this example?
- Does this already exist elsewhere in the hub?

If the answer is unclear, the content likely belongs in `MORE` until its purpose is defined.

---

## Where Things Go

- **HTML/** → Markup structures grouped into chapter subfolders (`basic-elements/`, `forms/`, `galleries/`, `maps/`)  
- **CSS/** → Styling, global root variables, and presentation interaction patterns (`toggles-states/`)  
- **JS/** → JavaScript behaviours, programmatic logic, and event listeners (`ui-controls/`)  
- **BOOTSTRAP/** → Framework-specific layout usage and utility grids  
- **TEMPLATES/** → Full-page assembled layout compositions (`landing-pages/`)  
- **MORE/** → Advanced tracking headers, SEO structures, optimization hacks, or edge cases  

If something does not clearly fit, do not force it.

---

## Templates Guidelines

Templates should:
- Represent complete, macro full-page layouts
- Combine multiple building block patterns (HTML/CSS/JS) into a cohesive structure
- Reflect real use cases deployed on PAG digital properties

Templates should not:
- Demonstrate single isolated components or basic micro effects
- Include experimental or unverified one-off code
- Duplicate layouts or sequences already covered elsewhere

---

## Naming & Path Conventions

- Use descriptive, lowercase filenames separated exclusively with hyphens.
- **Root-Relative Links Only:** Never use relative path operators (`../../`) for asset includes or navigation hooks. All internal configurations must map to absolute roots (`/hub/nav/...`) to guarantee stability on static hosting networks.
- Always place files inside their designated chapter directory tier (e.g., a form code file goes inside `/pages/HTML/forms/`).

```text
Good Filename:   trader-contact-form.html
Good Pathing:    /hub/pages/HTML/forms/html-form.html

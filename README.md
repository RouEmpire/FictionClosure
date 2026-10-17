# FictionClosure

Desktop-first, Markdown-first fiction-writing workspace. Built with Electrobun, Bun, TypeScript, and Svelte 5.

## Key Features

- **Markdown-First Canonical Storage**: Manuscripts, character sheets, worldbuilding entries, and outline notes are stored as portable Markdown files on disk with YAML frontmatter.
- **Folder Persistence & Safe Atomic Writes**:
  - Remembers project folder path (`~/.config/fictionclosure/recent.json` & local cache).
  - Explicit `Ctrl+S` / `Cmd+S` workflow writes to temporary files and atomically renames to prevent corruption.
- **Writing Canvas & Soft-Wrap Gutter**:
  - Accurate rendered line measurement for soft-wrapped paragraphs in TypeScript.
  - Logical line numbers display at the start of paragraphs; wrapped lines display a dash (`-`).
  - Cursor highlight illuminates both the line number and dashes of the active paragraph.
  - Click any gutter row to jump cursor to the start of that line; Alt+Click to jump to the end of the line.
  - Gutter and writing textarea are locked in line-height, font-family, and vertical scrolling.
- **Home / Welcome Page & Project Management**:
  - **Recent Projects**: Remembers projects opened or created by the user in `localStorage`. Allows opening projects with a single click, searching/filtering recent projects, and safely removing entries from the application memory without deleting any user files from disk.
  - **Project Structure Analyzer**: Validates imported folders to ensure compliance with FictionClosure project schemas (`project.json`, Markdown chapters, character sheets, world codices, `.gitignore`, and `stacks.json`). Provides an interactive validation breakdown report before opening.
  - **Seamless Navigation**: Easily return from the writing workspace to the Home screen at any time via the `⌂ Home` header button.
  - **Home Topbar & Desktop Menus**:
    - Standard application menus: *File*, *Edit*, *View*, *Selection*, *Tools*, *Help*, and *FictionClosure* (opens About FictionClosure modal).
    - Topbar action controls: Settings button (`⚙️`), Tutorial walkthrough button (`[TODO]`), and Documentation button (`[TODO]`).
  - **Writing Analytics Dashboard (Apache ECharts)**:
    - High-level KPI metric cards: Total Projects, Total Words written, Total Characters made, Total World entries, Total Chapters, and Total Documents.
    - Word Count Goals vs Progress horizontal bar chart rendered dynamically via **Apache ECharts**.
    - Story Content Composition doughnut chart (Manuscripts, Characters, Worldbuilding, Notes) powered by **Apache ECharts**.
    - Fully reactive charts with `ResizeObserver` responsive layout scaling and theme integration.
- **Persistent Undo & Redo History**:
  - Custom redo/undo stack engine (`Ctrl+Z` to undo, `Ctrl+Alt+Z` to redo).
  - Stacks are saved to disk (`stacks.json`) alongside project files, persisting edit history across application restarts and reboots.
  - Size of both stacks is bounded to half of the project's `"targetWordCount"` defined in `project.json`.
  - Automatically generates `.gitignore` inside exported projects to ignore `stacks.json`.
- **Structured Project Tree**:
  - Categorized into Manuscript (chapters), Characters, World & Lore, and Notes & Outlines with live word counts.
- **Reading Preview & Wikilinks**:
  - Formatted reading view with interactive bidirectional wikilinks (`[[Elena Vance]]`).
- **Zen Writing Modes (3 Tiers)**:
  - **Zen Mode (`Ctrl+\`)**: Centered distraction-free writing canvas with sidebar and inspector hidden.
  - **Focus Zen Mode (`Ctrl+Shift+\`)**: Highlights the active paragraph that the cursor lives on while dimming all other paragraphs by 50%. The gutter displays the active paragraph normally with its line numbers and dashes, while non-active paragraphs show only line numbers (no dashes at all) with 50% opacity.
  - **Concentrate Zen Mode ("CZM") (`Ctrl+Alt+\`)**: Pure `<textarea>` writing surface with zero distraction. Hides the application header, line number gutter, editor toolbar, and editor status bar. Inherits Focus paragraph dimming.
  - **Universal Exit (`Esc`)**: Any Zen mode can be exited instantly using `Esc` (or its toggle shortcut) to restore the normal workspace layout.
- **Workspace Ergonomics**:
  - Collapsible sidebar (`Ctrl+Alt+B`) and Inspector (`Ctrl+J`).
  - Quick Command Palette (`Ctrl+K`).
  - Shortcuts Cheatsheet (`?`).
  - Universal `Esc` key behavior: instantly closes any active modal, dialog, floating drawer, or Zen mode.

## Keyboard Shortcuts

### View & Workspace
- `Ctrl + 1`: Switch to Edit view
- `Ctrl + 2`: Switch to Split view
- `Ctrl + 3`: Switch to Read view
- `Ctrl + W`: Toggle editor word wrap
- `Ctrl + Alt + B`: Toggle document tree sidebar
- `Ctrl + J`: Toggle document inspector drawer
- `Ctrl + \`: Toggle Zen Mode
- `Ctrl + Shift + \`: Toggle Focus Zen Mode (dims other paragraphs 50%)
- `Ctrl + Alt + \`: Toggle Concentrate Zen Mode (CZM) (pure textarea only)
- `Ctrl + P`: Open Preferences & Settings menu (Custom Font)
- `Ctrl + K`: Open Command Palette / Search
- `?` or `F1`: Open keyboard shortcuts cheat sheet
- `Esc`: Exit Zen mode / close open modal or floating drawer panel

### Sidebar Tree Navigation
- `Ctrl + Tab`: Focus sidebar tree
- `↑ / ↓` or `W / S`: Move selection up / down through folders and documents
- `← / →` or `A / D`: Collapse / expand selected folder
- `Enter` or `Space`: Select document or toggle folder
- `Ctrl + N`: Create new file under the selected folder category

### Text Formatting & Markdown
- `Ctrl + B`: Bold selected text (`**...**`)
- `Ctrl + I`: Italicize selected text (`*...*`)
- `Ctrl + L`: Wrap selected text in Wikilink (`[[...]]`)
- `Ctrl + Q`: Insert / toggle blockquote (`> `)
- `Ctrl + -`: Insert / toggle bullet list item (`- `)
- `Ctrl + Alt + T`: Insert task item for paragraph (`- [ ] `)
- `Ctrl + T`: Toggle task item checkbox (`[ ]` ↔ `[x]`)

### File Management & History
- `Ctrl + S`: Save project and current document to folder
- `Ctrl + Shift + S`: Change project save folder ("Save As...")
- `Ctrl + Z`: Undo edit in active document
- `Ctrl + Alt + Z`: Redo edit in active document
- `Click`: Click gutter row to jump cursor to start of line
- `Alt + Click`: Alt+Click gutter row to jump cursor to end of line
- `Tab`: Indent 2 spaces in editor

## Development

Run development with `hutch`:

```bash
# Development with hot module reloading
hutch run dev:hmr

# Standard dev mode
hutch run dev

# Run unit tests
hutch run test

# Type check
hutch pm exec -- tsc --noEmit

# Production Vite build
hutch pm exec -- vite build
```

---

## TODO / Planned Features

The following features and customizations are planned for upcoming releases:

- [ ] **Interactive Tutorial Walkthrough**: In-app onboarding tutorial guide explaining Markdown fiction writing workflows and shortcuts (marked as `[TODO]` in Topbar).
- [ ] **In-App Documentation & Syntax Guide**: Comprehensive offline documentation viewer for project structures, Wikilinks, and frontmatter (marked as `[TODO]` in Topbar).
- [ ] **Extended Appearance & Themes**:
  - [ ] Zed theme format compatibility and theme importer.
  - [ ] Custom accent colors and light/dark theme toggle.
  - [ ] Custom editor line widths and margins.
- [ ] **Advanced Typography & Editor Controls**:
  - [ ] Font size slider (e.g. 12px – 24px).
  - [ ] Line-height multiplier control (e.g. 1.4 – 2.0).
  - [ ] Tab size selector (2 spaces vs 4 spaces).
  - [ ] Cursor blink and block/line style options.
  - [ ] Native spellchecking toggle.
- [ ] **Persistence & Backups**:
  - [ ] Configurable auto-save frequency interval.
  - [ ] Automatic timestamped snapshot revisions and recovery drawer.
  - [ ] Git auto-commit support on project save.
  - [ ] One-click project ZIP archive export.
- [ ] **Keybindings & Power Tools**:
  - [ ] Full Vim navigation keybindings mode.
  - [ ] Custom keyboard shortcut rebinding interface.
- [ ] **Manuscript & Lore**:
  - [ ] Rich timeline/calendar view.
  - [ ] Interactive character relationship graph.
  - [ ] EPUB and PDF export pipelines.


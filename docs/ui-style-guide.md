# LedgerLY UI Style Guide

## 1. Color Palette
| Purpose         | Color Example      | Hex        |
|-----------------|-------------------|------------|
| Primary         | Navy Blue         | #1A237E    |
| Accent (Green)  | Emerald           | #43A047    |
| Accent (Red)    | Crimson           | #E53935    |
| Background      | White             | #FFFFFF    |
| Surface         | Light Gray        | #F5F6FA    |
| Text Primary    | Charcoal          | #212121    |
| Text Secondary  | Gray              | #757575    |
| Error           | Red               | #D32F2F    |
| Warning         | Orange            | #FFA000    |

## 2. Typography
- **Font Family:** Inter, Roboto, or system-ui
- **Headings:** Bold, clear, spaced
- **Body:** Regular, high contrast, 16px minimum
- **Numbers:** Use tabular/monospace for financial data

| Element   | Font Size | Weight | Example         |
|-----------|-----------|--------|-----------------|
| H1        | 2.25rem   | 700    | Dashboard Title |
| H2        | 1.5rem    | 600    | Section Title   |
| Body      | 1rem      | 400    | Table Text      |
| Caption   | 0.875rem  | 400    | Labels, Notes   |

## 3. Spacing & Layout
- **Grid:** 8px base grid
- **Section Padding:** 24–32px
- **Card Padding:** 16–24px
- **Element Spacing:** 8–16px between controls

## 4. Buttons
- **Primary:** Filled, bold, rounded corners (4–6px)
- **Secondary:** Outlined or ghost
- **Disabled:** Lower opacity, no shadow
- **States:** Hover, active, focus, loading spinner

## 5. Charts
- **Colors:** Use accent green for inflow, red for outflow, blue for net, muted colors for categories
- **Legibility:** Large axis labels, tooltips, clear legends
- **Accessibility:** Colorblind-friendly palettes, patterns if needed

## 6. Forms & Inputs
- **Inputs:** Large click/tap targets, clear labels, error states in red
- **Validation:** Inline, with helpful messages
- **Focus:** Strong visible focus ring

## 7. Accessibility
- **Contrast:** All text and UI elements meet WCAG AA contrast
- **Keyboard:** All controls accessible via keyboard
- **Screen Reader:** Proper ARIA labels for all interactive elements

## 8. Microinteractions
- **Feedback:** Subtle animations for button presses, loading, and success/error
- **Transitions:** Fast (150–250ms), never distracting

## 9. Branding
- **Logo:** Simple, geometric, blue/green palette
- **Iconography:** Outline style, consistent stroke width 
/**
 * Design token constants for use in JS/TS (e.g. charts, dynamic styles).
 * Keep in sync with styles/design-tokens.css and config/design-system.json.
 */

export const colors = {
  bg: {
    primary: "#0d1117",
    secondary: "#161b22",
  },
  surface: {
    sidebar: "#0d1117",
    header: "#0d1117",
    editor: "#0d1117",
    hover: "#161b22",
    border: "#30363d",
  },
  action: {
    primary: "#58a6ff",
    primaryHover: "#4a8edf",
    success: "#238636",
    successHover: "#2ea043",
  },
  text: {
    primary: "#f0f6fc",
    secondary: "#c9d1d9",
    muted: "#8b949e",
    faded: "#484f58",
  },
  semantic: {
    success: { text: "#238636", bg: "rgba(35, 134, 54, 0.2)" },
    error: { text: "#da3633", bg: "rgba(218, 54, 51, 0.2)" },
    warning: { text: "#d29922", bg: "rgba(210, 153, 34, 0.2)" },
    info: { text: "#58a6ff", bg: "rgba(88, 166, 255, 0.2)" },
  },
  ring: "#58a6ff",
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const layout = {
  sidebarLeftWidth: 250,
  sidebarRightWidth: 300,
  headerHeight: 64,
  statusBarHeight: 24,
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1050,
  toast: 1100,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

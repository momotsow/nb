import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/app/globals.css";

// Fonts: next/font is unavailable in Storybook, so load Manrope (provisional, D-02)
// and Cormorant Garamond from Google Fonts and map them to the CSS variables
// that globals.css reads.
const FONT_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@200..800&display=swap");
:root { --font-manrope: "Manrope"; --font-cormorant: "Cormorant Garamond"; }
`;

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === "dark" ? "dark" : "light";
  // Set data-theme on the document root (what globals.css targets) and on the story root.
  document.documentElement.setAttribute("data-theme", theme);
  return (
    <div data-theme={theme} className="bg-bg text-ink p-4">
      <style>{FONT_CSS}</style>
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Theme (data-theme)",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Day Softness" },
          { value: "dark", title: "Evening Unwind" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
  },
};

export default preview;

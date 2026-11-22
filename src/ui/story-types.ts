import type { ComponentType, ReactNode } from "react";

// Minimal CSF 3 types so stories typecheck before Storybook is installed (task 8).
// Task 8 replaces these imports with `@storybook/react` types.
export type Meta<P> = {
  title: string;
  component: ComponentType<P>;
  tags?: string[];
  args?: Partial<P>;
  parameters?: Record<string, unknown>;
};

export type StoryObj<P> = {
  name?: string;
  args?: Partial<P>;
  render?: (args: P) => ReactNode;
  play?: (context: { canvasElement: HTMLElement }) => void | Promise<void>;
};

/** Play helper for "Focus" stories: focus the first interactive control. */
export function focusFirstControl({ canvasElement }: { canvasElement: HTMLElement }) {
  canvasElement.querySelector<HTMLElement>("button, a[href], input, select, textarea")?.focus();
}

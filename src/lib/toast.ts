/**
 * The toast store (Design System §7.6).
 *
 * A module-scope subject holding at most one toast — no library, because the
 * state is one nullable object with one subscriber. The single-slot design is
 * the spec: §7.6 says toasts never stack, and rapid re-triggers replace rather
 * than queue. Modelling it as a queue and then capping the queue at one would
 * be the same behaviour with somewhere for a bug to hide.
 *
 * V1 raises exactly one toast, on resume download.
 */
export interface Toast {
  /** Dictionary key for the message. */
  messageKey: string;
  /** Optional inline action, e.g. "Get in touch". */
  linkKey?: string;
  linkHref?: string;
  /**
   * Changes on every trigger so React remounts the element and replays the
   * entry animation. Without it, re-triggering while a toast is visible swaps
   * the text in place and the new message arrives with no motion at all.
   */
  key: number;
}

/**
 * §7.6. Not a motion token: `--duration-*` describes transitions, and this is
 * how long a message stays readable — a different kind of number that happens
 * to share a unit.
 */
export const TOAST_DURATION_MS = 3000;

type Listener = (toast: Toast | null) => void;

const listeners = new Set<Listener>();
let current: Toast | null = null;
let counter = 0;

export function getToast(): Toast | null {
  return current;
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener(current);
}

export function showToast(toast: Omit<Toast, 'key'>): void {
  current = { ...toast, key: ++counter };
  emit();
}

export function dismissToast(): void {
  if (current === null) return;
  current = null;
  emit();
}

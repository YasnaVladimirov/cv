/**
 * Contact form submission: configuration, spam heuristics, payload shape.
 *
 * Separate from the component so the two rules that decide whether a message
 * is sent at all are pure functions with unit tests behind them (plan
 * Appendix A: Vitest covers `src/lib/` logic). A spam heuristic that is wrong
 * silently discards real messages from real people, which is the one failure
 * mode of this form nobody would ever hear about.
 */

/**
 * Field names as the FORM SERVICE expects them, not as the plan wrote them.
 *
 * Plan §6.1 specifies `_key` / `_honeypot` / `_time`, which are generic
 * placeholders — none of them authenticate against Web3Forms, the provider the
 * same step recommends, which reads `access_key` and treats `botcheck` as its
 * honeypot. Shipping the plan's literal names would mean a form that returns
 * 401 the first time the human tries it.
 *
 * Switching provider is this one object:
 *   Web3Forms  { key: 'access_key', honeypot: 'botcheck' }   ← current
 *   Formspree  { key: '_key',       honeypot: '_gotcha'  }
 */
const FIELDS = {
  key: 'access_key',
  honeypot: 'botcheck',
} as const;

/**
 * PUBLIC_ prefix is required for Astro to expose a variable to client code.
 * Neither value is a secret: the endpoint is public by design and the access
 * key only authorises delivery to an inbox the human already owns.
 */
export const FORM_ENDPOINT = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';
export const FORM_KEY = import.meta.env.PUBLIC_FORM_KEY ?? '';

/** Field names, exported so the markup and the payload cannot disagree. */
export const HONEYPOT_FIELD = FIELDS.honeypot;
export const KEY_FIELD = FIELDS.key;

/**
 * PRD FR-5. Three seconds is well under what a person needs to write a
 * message and far over what a script spends.
 */
export const MIN_SUBMIT_MS = 3000;

/** False until [HUMAN] supplies both env vars; the form falls back to mailto. */
export function isFormConfigured(): boolean {
  return FORM_ENDPOINT !== '' && FORM_KEY !== '';
}

/**
 * The two bot heuristics, per PRD FR-5. No CAPTCHA — §2 forbids one.
 *
 * A hit is answered with the SUCCESS state and no request (App Flow §4.7:
 * "silently accepted client-side, discarded server-side"). Showing a bot an
 * error tells it what to fix.
 */
export function isSpam({ honeypot, elapsedMs }: { honeypot: string; elapsedMs: number }): boolean {
  if (honeypot.trim() !== '') return true;
  return elapsedMs < MIN_SUBMIT_MS;
}

export interface ContactMessage {
  name: string;
  email: string;
  company: string;
  message: string;
}

/**
 * `subject` and `from_name` are what turn the provider's notification email
 * into something readable in an inbox; without them every message arrives
 * titled after the site.
 */
export function buildPayload(message: ContactMessage): Record<string, string> {
  return {
    [FIELDS.key]: FORM_KEY,
    name: message.name,
    email: message.email,
    company: message.company,
    message: message.message,
    from_name: message.name,
    subject: `Portfolio contact — ${message.name}`,
  };
}

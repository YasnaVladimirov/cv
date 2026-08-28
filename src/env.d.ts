/**
 * Typed environment variables (plan Appendix B).
 *
 * Every one is `PUBLIC_`, which is what lets Astro expose it to client code,
 * and none of them is a secret: the form endpoint and its access key only
 * authorise delivery to an inbox the human already owns, the Calendly URL is
 * a page anyone can visit, and the analytics id identifies a site rather than
 * a person. Anything that ever needs to stay secret must not carry this
 * prefix — it would be inlined into the built HTML.
 *
 * Declared optional because the site has to build and run with all of them
 * missing: every integration degrades to something that still works.
 */
interface ImportMetaEnv {
  /** Form service POST target, e.g. https://api.web3forms.com/submit */
  readonly PUBLIC_FORM_ENDPOINT?: string;
  /** Form service access key. */
  readonly PUBLIC_FORM_KEY?: string;
  /** Public booking page, with or without a scheme — see lib/calendly.ts. */
  readonly PUBLIC_CALENDLY_URL?: string;
  /** Umami website id. Absent means analytics no-ops. */
  readonly PUBLIC_ANALYTICS_SITE_ID?: string;
  /** Umami script origin; defaults to the cloud instance. */
  readonly PUBLIC_ANALYTICS_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

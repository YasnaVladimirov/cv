/**
 * The React half of the icon set (src/lib/icons.ts), for the interactive
 * islands. Same names, same v1-rename caveats; the two lists must stay in step.
 *
 * These DO ship to the browser. Imported from the package barrel rather than
 * deep-imported because `lucide-react` declares `sideEffects: false` and ships
 * one type declaration for the whole package — the bundler tree-shakes it to
 * exactly the icons named here, and deep paths would have no types.
 */
export {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CircleAlert,
  ExternalLink,
  Funnel,
  LoaderCircle,
  MessageCircle,
  X,
} from 'lucide-react';

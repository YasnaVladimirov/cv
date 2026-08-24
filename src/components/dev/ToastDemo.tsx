/**
 * Showcase harness for the Toast (plan §3.11). DEV-ONLY, deleted in Phase 10.3.
 *
 * A trigger has to live in React because `showToast` is a function call, and
 * Astro can only pass serialisable props to an island.
 */
import { showToast } from '../../lib/toast';
import { buttonClasses } from '../../lib/button-classes';

export default function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      <button
        type="button"
        className={buttonClasses('primary')}
        onClick={() =>
          showToast({
            messageKey: 'toast.resumeDownload.message',
            linkKey: 'toast.resumeDownload.link',
            linkHref: '#contact',
          })
        }
      >
        Trigger toast
      </button>
      <button
        type="button"
        className={buttonClasses('secondary')}
        onClick={() => showToast({ messageKey: 'toast.resumeDownload.message' })}
      >
        Trigger without link
      </button>
    </div>
  );
}

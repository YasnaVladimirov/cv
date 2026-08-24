/**
 * The contact form (Design System §7.9 composition, App Flow §4.7).
 *
 * Validates on submit only — never on blur, never as you type (App Flow
 * decision #15). Validating a field the moment focus leaves it means telling
 * someone their email is invalid while they are still typing it, which is the
 * single most common way a short form becomes hostile.
 *
 * Four states, all of them reachable and all of them rendered here: default,
 * submitting, success, and endpoint failure. The failure state is not a
 * dead end — it surfaces a mailto with the message already lost, so the point
 * of it is to hand back the address, not to apologise.
 *
 * Submission is stubbed until Phase 6. `?form=success` and `?form=error` drive
 * the two outcomes so the states can be reviewed before an endpoint exists.
 *
 * No CAPTCHA (§2). The honeypot and the timing check are the whole defence;
 * both are wired to a real endpoint in Phase 6, and the field is here now so
 * that adding it later does not mean reopening this component.
 */
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { CircleAlert } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';
import Button from './Button';
import FormField from './FormField';
import TextInput from './TextInput';
import Textarea from './Textarea';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

/**
 * Deliberately permissive: one @, something either side, a dot in the domain.
 * A stricter pattern rejects addresses that are perfectly valid, and the only
 * real test of an email address is sending to it.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  /** [HUMAN] supplies the real address in Phase 6; shown in the failure state. */
  email?: string;
}

export default function ContactForm({ email: contactEmail }: Props) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const mountedAt = useRef(Date.now());
  const summaryRef = useRef<HTMLParagraphElement>(null);

  // Dev-only outcome override, so both terminal states are reviewable before
  // Phase 6 gives this form somewhere to post.
  const [forced, setForced] = useState<string | null>(null);
  useEffect(() => {
    setForced(new URLSearchParams(window.location.search).get('form'));
  }, []);

  function validate(data: FormData): Errors {
    const next: Errors = {};
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!name) next.name = 'contact.form.error.nameRequired';
    if (!email) next.email = 'contact.form.error.emailRequired';
    else if (!EMAIL.test(email)) next.email = 'contact.form.error.emailInvalid';
    if (!message) next.message = 'contact.form.error.messageRequired';
    return next;
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the summary so the errors are announced and the first
      // broken field is one Tab away. Without this the form silently does
      // nothing for anyone not looking at the top of it.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus('submitting');

    // Phase 6 replaces this with the real POST. The honeypot and the elapsed
    // time are read there; they are collected here so the shape is settled.
    const honeypot = String(data.get('website') ?? '');
    const elapsed = Date.now() - mountedAt.current;
    void honeypot;
    void elapsed;

    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus(forced === 'error' ? 'error' : 'success');
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <p className="text-xl font-semibold text-text-primary">
          {t('contact.form.success.heading')}
        </p>
        <p className="text-base text-text-secondary">{t('contact.form.success.body')}</p>
        <p className="text-sm text-text-tertiary">{t('contact.form.success.alternative')}</p>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-live="polite">
      {hasErrors && (
        <p ref={summaryRef} tabIndex={-1} className="flex items-center gap-1 text-sm text-error">
          <CircleAlert size={14} aria-hidden="true" className="shrink-0" />
          {t('contact.form.error.summary')}
        </p>
      )}

      <FormField id="contact-name" labelKey="contact.form.label.name" errorKey={errors.name}>
        {(a11y) => (
          <TextInput
            {...a11y}
            name="name"
            type="text"
            autoComplete="name"
            placeholderKey="contact.form.placeholder.name"
            invalid={Boolean(errors.name)}
          />
        )}
      </FormField>

      <FormField id="contact-email" labelKey="contact.form.label.email" errorKey={errors.email}>
        {(a11y) => (
          <TextInput
            {...a11y}
            name="email"
            type="email"
            autoComplete="email"
            placeholderKey="contact.form.placeholder.email"
            invalid={Boolean(errors.email)}
          />
        )}
      </FormField>

      <FormField id="contact-company" labelKey="contact.form.label.company">
        {(a11y) => (
          <TextInput
            {...a11y}
            name="company"
            type="text"
            autoComplete="organization"
            placeholderKey="contact.form.placeholder.company"
          />
        )}
      </FormField>

      <FormField
        id="contact-message"
        labelKey="contact.form.label.message"
        errorKey={errors.message}
      >
        {(a11y) => (
          <Textarea
            {...a11y}
            name="message"
            rows={5}
            placeholderKey="contact.form.placeholder.message"
            invalid={Boolean(errors.message)}
          />
        )}
      </FormField>

      {/*
        The honeypot. Hidden from sight, from the tab order and from screen
        readers — a bot fills it, a person cannot reach it. `display: none` on
        the wrapper rather than `type="hidden"`, because some bots skip hidden
        inputs and fill everything else.
      */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === 'error' && (
        <div className="flex flex-col gap-1 rounded-sm bg-error-bg p-3">
          <p className="flex items-center gap-1 text-sm text-error">
            <CircleAlert size={14} aria-hidden="true" className="shrink-0" />
            {t('contact.form.error.endpoint')}
          </p>
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm font-medium text-accent underline underline-offset-[3px]"
            >
              {contactEmail}
            </a>
          )}
        </div>
      )}

      <Button
        type="submit"
        labelKey="contact.form.submit"
        loadingKey="contact.form.submitting"
        loading={status === 'submitting'}
        className="self-start"
      />
    </form>
  );
}

/**
 * Showcase harness for the form primitives (plan §3.10). DEV-ONLY.
 *
 * These have to be demonstrated from inside React, not from the .astro page.
 * FormField takes its children as a render prop, and children crossing the
 * Astro-to-island boundary arrive as slot content, not as a function — the
 * island renders and throws `children is not a function`.
 *
 * That is not a limitation to work around; it is the correct shape. FormField,
 * TextInput and Textarea are only ever mounted inside ContactForm, which is
 * itself the island. None of the three is an entry point.
 */
import FormField from '../interactive/FormField';
import TextInput from '../interactive/TextInput';
import Textarea from '../interactive/Textarea';

export default function FormFieldDemo() {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <FormField id="demo-name" labelKey="contact.form.label.name">
          {(a11y) => <TextInput {...a11y} placeholderKey="contact.form.placeholder.name" />}
        </FormField>

        <FormField
          id="demo-email"
          labelKey="contact.form.label.email"
          helperKey="contact.privacyNote"
        >
          {(a11y) => (
            <TextInput {...a11y} type="email" placeholderKey="contact.form.placeholder.email" />
          )}
        </FormField>

        <FormField
          id="demo-email-error"
          labelKey="contact.form.label.email"
          helperKey="contact.privacyNote"
          errorKey="contact.form.error.emailInvalid"
        >
          {(a11y) => (
            <TextInput
              {...a11y}
              type="email"
              invalid
              defaultValue="not-an-email"
              placeholderKey="contact.form.placeholder.email"
            />
          )}
        </FormField>

        <FormField id="demo-disabled" labelKey="contact.form.label.company">
          {(a11y) => (
            <TextInput {...a11y} disabled placeholderKey="contact.form.placeholder.company" />
          )}
        </FormField>
      </div>

      <div className="w-full max-w-prose">
        <FormField id="demo-message" labelKey="contact.form.label.message">
          {(a11y) => (
            <Textarea {...a11y} rows={5} placeholderKey="contact.form.placeholder.message" />
          )}
        </FormField>
      </div>
    </div>
  );
}

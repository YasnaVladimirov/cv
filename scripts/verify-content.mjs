/**
 * Content integrity checks that Zod cannot express.
 *
 * Zod validates each file in isolation. These two failures span files, so
 * they pass schema validation and then produce a quietly broken page:
 *
 *  1. An MDX case study missing one of its two language blocks. The build
 *     succeeds and the page simply renders blank in that language
 *     (plan 2.5).
 *  2. A `timeline_matches` entry naming a role id that does not exist. The
 *     skill still renders as an interactive button, filters the timeline to
 *     nothing, and produces the zero-result state App Flow 4.6 designs out
 *     of existence.
 *
 * Run: node scripts/verify-content.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const CASE_STUDIES = 'src/content/case-studies';
const ROLES = 'src/content/roles';
const SKILLS = 'src/content/skills/skills.json';

const fail = [];

// --- 1. every MDX case study carries both language blocks ----------------
const studies = existsSync(CASE_STUDIES)
  ? readdirSync(CASE_STUDIES).filter((f) => ['.md', '.mdx'].includes(extname(f)))
  : [];

if (!studies.length) fail.push(`No case studies found in ${CASE_STUDIES}/.`);

for (const file of studies) {
  const raw = readFileSync(join(CASE_STUDIES, file), 'utf8');
  // Strip frontmatter so a language name appearing there cannot satisfy the check.
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');

  for (const lang of ['en', 'sr']) {
    const open = new RegExp(`<div\\s+data-lang=["']${lang}["']\\s*>`);
    if (!open.test(body)) {
      fail.push(`${file}: missing the <div data-lang="${lang}"> block.`);
      continue;
    }
    // Present but empty is the same failure with a friendlier disguise.
    const section = body.split(open)[1]?.split('</div>')[0] ?? '';
    if (section.trim().length < 20) {
      fail.push(`${file}: the data-lang="${lang}" block is empty or near-empty.`);
    }
  }
}

// --- 2. timeline_matches point at real roles -----------------------------
const roleIds = existsSync(ROLES)
  ? readdirSync(ROLES)
      .filter((f) => extname(f) === '.json')
      .map((f) => basename(f, '.json'))
  : [];

if (existsSync(SKILLS)) {
  const categories = JSON.parse(readFileSync(SKILLS, 'utf8'));
  for (const category of categories) {
    for (const skill of category.skills ?? []) {
      for (const match of skill.timeline_matches ?? []) {
        if (!roleIds.includes(match)) {
          fail.push(
            `skills.json: "${skill.name}" references role "${match}", which does not exist.\n` +
              `      Known roles: ${roleIds.join(', ')}`,
          );
        }
      }
    }
  }
}

// --- 3. case study references on roles resolve ---------------------------
const studyIds = studies.map((f) => basename(f, extname(f)));
for (const file of readdirSync(ROLES).filter((f) => extname(f) === '.json')) {
  const role = JSON.parse(readFileSync(join(ROLES, file), 'utf8'));
  if (role.case_study && !studyIds.includes(role.case_study)) {
    fail.push(
      `${file}: case_study "${role.case_study}" does not exist. Known: ${studyIds.join(', ')}`,
    );
  }
}

if (fail.length) {
  console.error(`\n✗ Content verification failed (${fail.length}):\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log(
  `✓ Content verified: ${studies.length} case studies with both language blocks, ` +
    `all timeline_matches and case_study references resolve.`,
);

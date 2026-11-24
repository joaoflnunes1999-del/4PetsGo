/**
 * Phase 1 end-to-end flow on Expo Web (fallback when no Mac/iOS simulator is available).
 * Usage: EXPO_OFFLINE=1 npx expo start --web --port 8081  then
 *        node e2e/phase1-web.mjs <fixturesDir> <screenshotsDir>
 * The reference test on iOS is done with Argent (see CLAUDE.md).
 */
import { createRequire } from 'node:module';

// Uses the globally installed Playwright (require resolves via NODE_PATH, ESM imports do not).
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';

const [fixtures, shots] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? 'http://localhost:8081';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

const id = (t) => page.getByTestId(t);
let n = 0;
const shot = async (name) => page.screenshot({ path: path.join(shots, `${String(++n).padStart(2, '0')}-${name}.png`) });
const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message.split('\n')[0]}`);
    await shot(`FAIL-${name.replace(/\W+/g, '-')}`);
    throw e;
  }
};

try {
  await page.goto(BASE);
  await step('welcome screen', async () => {
    await page.getByText('Your Pet, their care, one place!').waitFor();
    await shot('welcome');
    await id('welcome-start').click();
  });
  await step('owner onboarding', async () => {
    await id('role-owner').click();
    await id('owner-firstname').fill('Julie');
    await id('city-paris').click();
    await shot('owner-onboarding');
    await id('owner-continue').click();
  });
  await step('create pet: species → breed → auto image → details', async () => {
    await id('species-dog').click();
    await id('breed-search').fill('golden');
    await id('breed-dog-golden-retriever').click();
    await page.getByText('Cette image sera sa photo de profil par défaut').waitFor();
    await shot('breed-selected');
    await id('breed-continue').click();
    await id('pet-name').fill('Pistache');
    if (!(await id('pet-create').isDisabled())) throw new Error('a dog cannot be created without its weight');
    await id('pet-weight').fill('28');
    if (await page.getByText(/tarif|Catégorie/).count()) throw new Error('the weight field must not mention pricing');
    await id('pet-create').click();
    await page.getByText('Le profil de Pistache est prêt').waitFor();
    await shot('pet-profile-created');
  });
  await step('gallery: import 4 photos from library', async () => {
    await id('add-photos').click();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), id('sheet-library').click()]);
    await chooser.setFiles([1, 2, 3, 4].map((i) => path.join(fixtures, `pet${i}.jpg`)));
    await id('gallery-photo-3').waitFor({ timeout: 15000 });
    await page.getByText('4', { exact: true }).first().waitFor();
    await shot('gallery-grid');
  });
  await step('viewer: swipe, caption, set main photo', async () => {
    await id('gallery-photo-1').click();
    await page.getByText('2 / 4').waitFor();
    await id('viewer-menu').click();
    await id('viewer-caption').click();
    await id('caption-input').fill('Première balade au parc');
    await id('caption-save').click();
    await id('caption-input').waitFor({ state: 'detached' });
    await page.getByText('Première balade au parc').first().waitFor();
    await id('viewer-menu').click();
    await id('viewer-set-main').click();
    await page.getByText('PHOTO PRINCIPALE').waitFor();
    await shot('viewer');
    await id('viewer-close').click();
  });
  await step('viewer: delete a photo', async () => {
    await id('gallery-photo-0').click();
    await id('viewer-menu').click();
    await id('viewer-delete').click();
    await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
    await page.getByText('1 / 3').waitFor();
    await id('viewer-close').click();
    await id('gallery-photo-2').waitFor();
  });
  await step('edit profile: bio; gallery is public inside the app (no privacy setting)', async () => {
    await page.getByRole('button', { name: 'Modifier le profil' }).click();
    await id('edit-bio').fill('Golden au grand cœur, fan de balles de tennis.');
    if (await page.getByRole('tab', { name: 'Confidentialité' }).count()) throw new Error('privacy tab must be gone');
    await id('pet-save').click();
    await id('edit-bio').waitFor({ state: 'detached' }); // edit screen fully closed
    await page.getByText('Golden au grand cœur').first().waitFor();
    await page.getByText(/Photos visibles par les membres de 4PetsGo/).waitFor();
    await page.getByRole('tab', { name: 'Soins' }).click();
    await page.getByText('Informations sensibles').waitFor();
    await shot('pet-care-tab');
  });
  await step('search: ranked eligible sitters for a 28 kg dog in Paris', async () => {
    await id('created-search').click();
    await page.getByText(/Pet Sitters? disponibles? près de Paris/).waitFor();
    await id('sitter-card-sitter-ines').waitFor();
    // Camille & Léa do not accept large dogs → filtered out.
    if (await id('sitter-card-sitter-camille').count()) throw new Error('Camille should be filtered out');
    await shot('search-results');
  });
  await step('sitter profile: 4 compact key tiles first, services after, no prices', async () => {
    await id('sitter-card-sitter-ines').click();
    await id('sitter-facts').waitFor();
    if ((await id('sitter-facts').locator('[data-testid^="tile-"]').count()) !== 4) throw new Error('expected 4 key tiles');
    const tilesBox = await id('sitter-facts').boundingBox();
    if (tilesBox.height > 844 * 0.2) throw new Error(`key tiles too tall: ${tilesBox.height}px`);
    await id('tile-housing').getByText('120 m²').waitFor();
    const factsBox = await id('sitter-facts').boundingBox();
    const servicesBox = await id('service-boarding').boundingBox();
    if (!(factsBox.y < servicesBox.y)) throw new Error('facts must appear before services');
    await page.getByText(/41 ans · Paris/).waitFor();
    if (await page.getByText(/€ \/ jour/).count()) throw new Error('prices must not be shown on the profile');
    await shot('sitter-profile');
    await id('sitter-toggle').click();
    await page.getByRole('button', { name: 'Retour' }).click();
  });
  await step('multi-sitter request', async () => {
    await id('select-sitter-marc').click();
    await id('send-request').click();
    await page.getByText('Pet Sitters contactés').waitFor();
    await id('request-proposal').fill('10');
    await id('request-floor').getByText(/^Prix minimum : /).waitFor();
    await page.getByText(/Prix minimum : /).nth(1).waitFor(); // field error shows only the amount
    await id('request-proposal').fill('');
    await shot('request-review');
    await id('request-send').click();
    await id('mission-id').waitFor();
  });
  const missionId = await id('mission-id').innerText();
  await step(`negotiation on ${missionId}: counter-offers and floor`, async () => {
    if (!/^4PG-[A-Z2-9]{6}$/.test(missionId)) throw new Error(`bad mission id ${missionId}`);
    await id('demo-counter-sitter-ines').click();
    await id('counter-input').fill('20');
    await page.getByText(/^Prix minimum : /).first().waitFor();
    await id('counter-input').fill('140');
    await id('counter-submit').click();
    await id('me-counter-sitter-ines').click();
    await id('counter-input').fill('125');
    await id('counter-submit').click();
    await id('demo-counter-sitter-ines').click();
    await id('counter-input').fill('132');
    await id('counter-submit').click();
    await shot('negotiation');
  });
  await step('accepting locks the mission; other sitter can no longer accept', async () => {
    await id('me-accept-sitter-ines').click();
    await id('locked-card').waitFor();
    await page.getByText('MISSION VERROUILLÉE').first().waitFor();
    if (await id('demo-accept-sitter-marc').count()) throw new Error('Marc can still accept');
    await page.getByText('CLÔTURÉE', { exact: true }).waitFor();
    await shot('mission-locked');
  });
  await step('missions tab lists the locked mission', async () => {
    await page.getByRole('button', { name: 'Voir mes missions' }).click();
    await page.getByText(missionId).waitFor();
    await page.getByText(/Avec Inès/).waitFor();
    await shot('missions-tab');
    await page.getByRole('tab', { name: /Mes animaux/ }).click();
    await id('pet-card-Pistache').waitFor();
    await id('add-pet').waitFor();
    await shot('pets-grid');
  });
  await step('persistence after reload', async () => {
    await page.reload();
    await id('pet-card-Pistache').waitFor();
    await page.getByRole('tab', { name: /Missions/ }).click();
    await page.getByText(missionId).waitFor();
  });
  await step('Owner Club skin: crown on the owner avatar (demo toggle)', async () => {
    await page.getByRole('tab', { name: /Profil/ }).click();
    if (await id('owner-club-crown').count()) throw new Error('crown must be hidden without Owner Club');
    await id('demo-owner-club').click();
    await id('owner-club-crown').waitFor();
    await page.getByText('Membre Owner Club').waitFor();
    await shot('owner-club-crown');
  });
  await step('reset local data', async () => {
    await page.getByRole('tab', { name: /Profil/ }).click();
    await id('reset').click();
    await page.getByRole('button', { name: 'Tout effacer' }).click();
    await id('welcome-start').waitFor();
  });
  await step('sitter onboarding: floor validation + dynamic home section', async () => {
    await id('welcome-start').click();
    await id('role-sitter').click();
    await id('sitter-firstname').fill('Alex');
    await id('sitter-age').fill('29');
    await id('city-geneve').click();
    await id('svc-boarding').click();
    await page.getByText('My Home & Environment').waitFor();
    const catRate = page.getByPlaceholder(/CHF.20\.20/);
    await catRate.fill('15'); // below the CH cat minimum (CHF 20.20)
    if (!(await id('sitter-submit').isDisabled())) throw new Error('submit should be disabled below the floor');
    await catRate.fill('28');
    if (await id('sitter-submit').isDisabled()) throw new Error('submit should be enabled');
    await shot('sitter-onboarding');
    await id('sitter-submit').click();
    await page.getByText('Aucune demande pour l’instant').waitFor();
    await page.getByRole('tab', { name: /Profil/ }).click();
    await page.getByText('Niveau 1 · Beginner').waitFor();
    if (await page.getByText(/commission/i).count()) throw new Error('commission must not be shown on the profile tab');
    await shot('sitter-profile-tab');
    await id('levels-info').click();
    await id('level-info-master').waitFor();
    await page.getByText(/Commission la plus basse : 1\s%/).waitFor();
    await page.waitForTimeout(700); // let the sheet finish sliding in
    await shot('levels-info');
  });
} finally {
  const relevant = errors.filter((e) => !/favicon|DevTools/.test(e));
  if (relevant.length) console.log('Console errors:\n' + relevant.join('\n'));
  await browser.close();
}

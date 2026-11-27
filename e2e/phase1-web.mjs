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
let dropoff = '';
let pickup = '';
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
    await id('welcome-sign-in').click();
    await id('signin-email').fill('julie@exemple.fr');
    await id('signin-send').click();
    await id('signin-error').waitFor(); // no Supabase project yet in local dev: clear message, no dead end
    await shot('sign-in');
    await page.goBack();
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
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Augmenter Nombre de jours' }).click(); // 7-day stay
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
  await step('owner: confirm mission → chat opens, no First Night Update before the hand-over', async () => {
    await id('confirm-mission').click();
    await id('chat-input').waitFor();
    await page.getByText('Mission confirmée · le chat est ouvert').waitFor();
    if (await id('fnu-pending').count()) throw new Error('First Night Update must not exist before the hand-over');
    await id('chat-input').fill('Bonjour Inès ! Pistache adore sa balle bleue.');
    await id('chat-send').click();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), id('chat-attach').click()]);
    await chooser.setFiles(path.join(fixtures, 'ordonnance.pdf'));
    await page.getByText('ordonnance.pdf').waitFor();
    await id('chat-codes').click();
    dropoff = (await id('dropoff-code').innerText()).replace(/\s/g, '');
    await page.waitForTimeout(600);
    await shot('owner-dropoff-code');
    await page.getByRole('button', { name: 'Fermer', exact: true }).click();
    await id('dropoff-code').waitFor({ state: 'detached' });
  });
  await step('sitter view: reply, then enter the drop-off code at hand-over', async () => {
    await id('view-sitter').click();
    await id('chat-input').fill('Avec plaisir Julie ! J’ai bien reçu l’ordonnance, je m’occupe de tout.');
    await id('chat-send').click();
    await page.getByText(/je m’occupe de tout/).waitFor();
    await shot('sitter-chat-before-handover');
    await id('chat-codes').click();
    await id('dropoff-input').waitFor();
    await page.waitForTimeout(600);
    await shot('sitter-dropoff-entry');
    await id('dropoff-input').fill(dropoff === '123456' ? '654321' : '123456');
    await id('dropoff-submit').click();
    await page.getByText('Code incorrect.').waitFor();
    await id('dropoff-input').fill(dropoff);
    await id('dropoff-submit').click();
    await page.getByText('Pistache a été remis au Pet Sitter · mission commencée').waitFor();
    await id('fnu-pending').waitFor();
    await id('fnu-answer').waitFor();
    await page.waitForTimeout(400);
    await shot('sitter-fnu-pending');
  });
  await step('sitter view: First Night Update with reward hint → green check + 10 Paw Points', async () => {
    if (await id('fnu-reward').count()) throw new Error('no reward before the answer');
    await id('fnu-answer').click();
    await id('fnu-night-calm').click();
    await id('fnu-morning-playful').click();
    await id('fnu-comment').fill('Il a dormi au pied du lit !');
    await id('fnu-reward-hint').getByText(/gagner 10 Paw Points au lieu de 7/).waitFor();
    await id('fnu-comment').fill('Pistache a dormi toute la nuit au pied du lit, puis il a réclamé sa balle bleue dès sept heures du matin.');
    await id('fnu-reward-hint').getByText(/vous gagnerez 10 Paw Points/).waitFor();
    await page.waitForTimeout(300);
    await shot('sitter-fnu-form');
    await id('fnu-submit').click();
    await id('fnu-answered').waitFor();
    await id('fnu-reward').getByText('+10').waitFor();
    await page.waitForTimeout(400);
    await shot('sitter-fnu-answered');
  });
  await step('48 h photo reminders: upcoming → due → photo sent → next slot', async () => {
    await id('photo-banner-calm').waitFor();
    await page.getByText(/Prochaine photo à envoyer : jour 2/).waitFor();
    await shot('photo-reminder-upcoming');
    await id('demo-advance').click();
    await id('demo-advance').click(); // +48 h
    await id('photo-banner-due').waitFor();
    await page.getByText(/Photo du jour 2 à envoyer avant/).waitFor();
    await shot('photo-reminder-due');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), id('photo-banner-send').click()]);
    await chooser.setFiles(path.join(fixtures, 'pet2.jpg'));
    await page.getByText(/Prochaine photo à envoyer : jour 4/).waitFor();
    await page.waitForTimeout(400);
    await shot('photo-reminder-sent');
    await id('view-owner').click();
    await page.getByText(/Prochaine photo de Inès : jour 4/).waitFor();
    await shot('photo-reminder-owner');
    await id('view-sitter').click();
  });
  await step('sitter view: generate the pick-up code (early end needs a reason)', async () => {
    await id('chat-codes').click();
    await id('pickup-reason-early_owner').click();
    await id('pickup-generate').click();
    pickup = (await id('pickup-code').innerText()).replace(/\s/g, '');
    await page.waitForTimeout(600);
    await shot('sitter-pickup-code');
    await page.getByRole('button', { name: 'Fermer', exact: true }).click();
    await id('pickup-code').waitFor({ state: 'detached' });
  });
  await step('owner view: type the pick-up code → mission completed', async () => {
    await id('view-owner').click();
    await page.getByText(/Code de fin de mission généré · Le propriétaire reprend son animal plus tôt/).waitFor();
    await id('chat-codes').click();
    await id('pickup-input').fill(pickup);
    await id('pickup-submit').click();
    await page.getByText('Animal récupéré · mission terminée').waitFor();
    await page.waitForTimeout(400);
    await shot('owner-chat-completed');
  });
  await step('reviews: 4 criteria, hidden until both have reviewed', async () => {
    await id('review-todo').waitFor();
    await id('review-open').click();
    await page.waitForTimeout(500);
    for (const [k, v] of [['care', 5], ['communication', 5], ['punctuality', 4], ['overall', 5]]) await id(`review-${k}-${v}`).click();
    await id('review-comment').fill('Inès a été parfaite, Pistache est rentré ravi !');
    await shot('review-form-owner');
    await id('review-submit').click();
    await id('review-waiting').waitFor();
    await page.getByText(/Il sera visible quand Inès aura donné le sien/).waitFor();
    await id('review-submit').waitFor({ state: 'detached' });
    await page.waitForTimeout(400);
    await shot('review-waiting-owner');
    await id('view-sitter').click();
    await id('review-open').click();
    await page.waitForTimeout(500);
    for (const [k, v] of [['punctuality', 5], ['communication', 5], ['agreements', 5], ['handover', 5]]) await id(`review-${k}-${v}`).click();
    await id('review-comment').fill('Julie avait tout préparé, un plaisir !');
    await shot('review-form-sitter');
    await id('review-submit').click();
    await id('review-published').waitFor();
    await page.getByText('« Inès a été parfaite, Pistache est rentré ravi ! »').waitFor();
    await page.waitForTimeout(300);
    await shot('review-published-sitter');
    await page.getByRole('button', { name: 'Retour' }).first().click();
    await id('open-chat').waitFor();
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

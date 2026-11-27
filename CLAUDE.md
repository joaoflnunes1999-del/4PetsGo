# 4PetsGo — CLAUDE.md

Marketplace iOS reliant Owners (propriétaires d'animaux) et Pet Sitters, en France et en Suisse.
Docs produit : [`docs/PRD.md`](docs/PRD.md) · [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Phase actuelle : Phase 2 en cours.** Le schéma Supabase, la RLS et la négociation côté serveur sont faits et testés sur PostgreSQL local. Le branchement de l'app à Supabase attend le projet du fondateur.

## Règles de travail

- Avant chaque phase : rédiger un plan court et **attendre l'approbation du fondateur**.
- Un commit par fonctionnalité opérationnelle, avec un message clair. Ne pousser que sur la branche de travail.
- Une fonctionnalité n'est terminée qu'après avoir été **testée dans le simulateur iPhone (Argent)**. Si aucun Mac n'est disponible, la tester sur Expo Web via Playwright **et le signaler**.
- Ne jamais transformer un point « ⚠️ À valider » du PRD en décision définitive.
- Aucun bouton qui ne fait rien. Aucun écran « Bientôt disponible » ou « Coming soon ».
- **Aucune clé secrète dans l'application** (Supabase service role, Stripe secret, Resend, etc.). Elles vivent uniquement dans les Edge Functions, à partir de la phase 2.
- Textes de l'interface en **français**. Code, identifiants et commits en **anglais**.

## Commandes

```bash
npm install
npx expo start            # serveur de dev (i = simulateur iOS, w = web)
npm run ios               # build natif + simulateur (macOS + Xcode requis)
npm run web               # Expo Web (test sans Mac)
npm run typecheck         # tsc --noEmit
npm run lint              # expo lint
npm test                  # Jest (logique métier)
npm run check             # typecheck + lint + tests — à lancer avant chaque commit
npm run db:test           # migrations + tests RLS/négociation + test de concurrence (PostgreSQL local, PGHOST/PGPORT)
# E2E Expo Web (sans Mac) : lancer le serveur web, puis
node e2e/phase1-web.mjs <dossier-photos-jpg pet1..pet4> <dossier-captures>
EXPO_OFFLINE=1 npx expo install <pkg>   # ajouter une dépendance compatible avec le SDK (offline si api.expo.dev est bloqué)
```

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, Expo Router (routes typées), TypeScript strict, React Compiler activé.
- État local : **Zustand** + `persist` (AsyncStorage). Ce stockage sera remplacé par Supabase en phase 2.
- Polices : Poppins (titres) et Inter (texte), via `@expo-google-fonts/poppins` et `@expo-google-fonts/inter`.
- Icônes : `@expo/vector-icons` (Feather et MaterialCommunityIcons).
- Images : `expo-image` pour l'affichage, `expo-image-picker` pour la caméra et la photothèque.
- Tests : Jest (`jest-expo`) pour la logique pure, dans `src/features/**/__tests__`. Le parcours E2E Playwright sur Expo Web est dans `e2e/phase1-web.mjs` (onboarding → animal → galerie → recherche → négociation → verrouillage → Pet Sitter).
- À venir : Supabase (Postgres, RLS, Auth Apple, Storage, Edge Functions), Stripe Connect, Superwall/StoreKit, PostHog, Sentry, Resend.

## Architecture

```
src/
  app/                     # Routes Expo Router (1 fichier = 1 écran). Aucune logique métier ici.
    _layout.tsx            # Stack racine, chargement des polices, garde d'onboarding
    index.tsx              # Redirection : onboarding ou onglets
    welcome.tsx, onboarding/*
    (tabs)/                # Onglets : Mes animaux · Rechercher · Missions · Profil
    pet/                   # Création et profil d'un animal, galerie, visionneuse
    sitter/[id].tsx        # Profil public d'un Pet Sitter
    request/               # Nouvelle demande, détail et négociation
  theme/                   # DESIGN SYSTEM — tokens.ts (couleurs, typo, espacements, rayons, ombres)
  components/ui/           # Composants réutilisables (Text, Button, Card, Input, Chip…)
  features/
    pricing/               # Moteur de prix pur (centimes entiers) + config FR/CH
    booking/               # Machine à états de la négociation (pure) + verrouillage
    pets/                  # Races, gabarit, âge
    sitters/               # Pet Sitters de démonstration + classement de la recherche
    levels/                # Niveaux Paw Points et commission selon le niveau
  store/                   # Store Zustand persistant (utilisateur, animaux, photos, demandes)
docs/                      # PRD, roadmap
.claude/skills/            # Skills : Superpowers, Supabase, Superwall, Argent (voir SOURCES.txt)
```

## Décisions techniques

- **Design system** : toute couleur, taille, espacement ou rayon vient de `@/theme`. Pas de valeur en dur dans les écrans.
- **Identité visuelle v4** (27/11/2026, inspirée de la maquete de référence du fondateur, remplace les versions précédentes) :

  | Rôle | Couleur | Token |
  |---|---|---|
  | **Actions uniquement** : boutons principaux, onglet actif, filtre actif | Terracotta `#B9674E` | `colors.action`, `colors.selected` |
  | Couleur naturelle de la marque : icônes, liens, coche « vérifié », bouton d'envoi du chat, états positifs | Vert forêt `#3F6A4F` | `colors.primary`, `colors.success`, `colors.sendButton` |
  | Grandes surfaces calmes : accueil, bandeau du profil Pet Sitter, mes bulles de chat, « Confirmée » | Vert sauge clair `#DFE9D8` | `colors.brandSurface`, `colors.bubbleOwn`, `colors.successSoft` |
  | Fond de l'app | Crème `#F6F1EA` | `colors.background` |
  | Cartes (sans contour, ombre chaude légère `shadow.card`) | Blanc crème `#FFFDFA` | `colors.surface` |
  | Étiquettes, zones secondaires | Sable `#F1E9DF` | `colors.surfaceMuted` |
  | Récompenses, Paw Points, étoiles, Owner Club | Or doux `#D5AD79` / `#FBEFD6` | `colors.accent*` |
  | Textes et titres | Charbon `#2F2B28` | `colors.text` |

  - **Typographie** : **Poppins** (SemiBold, Bold), géométrique et arrondie, pour les titres, les noms, les montants et les libellés de boutons, avec une interlignage serré (`displayXL` 44, `displayL` 28, `displayM` 22, `title` 16). **Inter** pour le texte courant.
  - **Formes** : boutons et filtres en **pilule** (`radius.pill`), cartes arrondies à 20 px (`radius.lg`), étiquettes en petites pilules sable, icônes Feather au trait fin. Barre d'onglets blanche, onglet actif en terracotta.
  - Toutes les variantes sont dans `palette` (`src/theme/tokens.ts`). Les écrans n'utilisent que `colors.*`, et aucune couleur n'est écrite en dur ailleurs.
  - **Contraste** : blanc sur terracotta 4,1:1, uniquement pour des libellés gras de 16 px ou plus. Blanc sur vert forêt 6,2:1. Vert forêt sur crème 5,5:1.
  - **Badges de niveau et de confiance** : écrits avec une majuscule initiale (« Expert », « Identité vérifiée »), jamais en capitales, **en gras**, en charbon (variante `badge`). Les étoiles d'avis sont **pleines**, en Muted Gold (`colors.accent`).
  - **Niveaux** : chaque niveau a son emblème, une patte numérotée de 1 à 5 (`assets/images/levels/*.png`, composant `LevelIcon`, au moins 24 px pour que le chiffre reste lisible). **Unité Paw Points** : la pièce `assets/images/paw-coin.png` (composant `PawCoin`). On n'utilise plus d'icône de patte générique pour les Paw Points.
  - **Commission** : elle n'apparaît pas sur le profil du Pet Sitter. Elle n'est expliquée que dans la feuille d'information des niveaux (bouton « i » sous les 5 pattes, `LevelsInfoSheet`), avec des valeurs lues dans `pricing/config.ts`.
  - **Skin Owner Club** : couronne `mci:crown` pleine en Muted Gold, sur le cercle de la photo de l'Owner, à environ 20° dans le sens horaire et inclinée de 20° (`OwnerAvatar`, calcul dans `features/owners/crown.ts`). En phase 1, un interrupteur « Mode démo », visible seulement en développement dans l'onglet Profil, simule l'abonnement. Le vrai achat arrive avec Superwall en phase 3.
  - Photos de profil parfaitement circulaires, pour les utilisateurs comme pour les animaux. Les photos de la galerie restent carrées.
  - **Logo officiel** (fourni le 24/11/2026) : maison et patte en terracotta, « 4Pets » en charbon, « Go » en sauge, sur fond ivoire. Il sert d'icône d'app, de splash, de favicon et d'icône Android, avec le fond en Warm Ivory. Dans l'app, il passe par le composant `Logo` (`logo-mark.png`).
- **Profil Pet Sitter** : en haut, prénom, âge, ville et distance, puis **4 tuiles compactes** (`KeyTiles`, environ 10 % de l'écran, icône et valeur courte, sans libellé) : logement (icône maison ou immeuble, avec la surface), extérieur, enfants, animaux au foyer. Pour un Pet Sitter sans garde : rayon, expérience, missions, nombre de chiens. Ensuite la présentation, puis les services. **Aucun tarif sur le profil ni sur les cartes de résultats** : le prix apparaît seulement dans la demande, où il est négocié.
- **Prix minimum** : pour chaque animal, `MIN_DAILY_PRICE[pays][gabarit]`, où le gabarit vient du **poids, obligatoire pour un chien** (règle appliquée dans l'app et par la contrainte `pets_dog_weight_required`). Le repli sur `breeds.typical_size` ne sert que de filet de sécurité. **Ne jamais indiquer à l'Owner que le poids influence le prix**. Dans la demande et les contre-propositions, afficher seulement « Prix minimum : X € », sans explication (aucune catégorie, aucune mention du tarif près du champ Poids), pour éviter les sous-déclarations. Le minimum de la demande est la somme sur tous les animaux, multipliée par le nombre de jours. L'Owner ne peut jamais proposer moins, et aucune contre-proposition ne peut descendre sous ce montant. La règle est appliquée dans l'app (`floorFor`) **et** sur le serveur (`private.request_floor_cents`).
- **Visibilité** (décision du 25/11/2026) : le profil de l'animal et sa galerie sont **publics pour les membres connectés** (comme Instagram). Il n'y a plus de réglage de confidentialité. **Données sensibles** : photos de mission (chat, rapports, First Night Update) et `pet_care`, visibles seulement par l'Owner et le Pet Sitter d'une mission confirmée, pendant la mission.
- **Cycle de mission et paiement** (règles du fondateur du 25/11/2026, détail dans PRD §3.7) :
  - `confirm_mission` (stand-in du paiement Stripe jusqu'à la phase 3) génère un code de remise que seul l'Owner voit (`get_dropoff_code`).
  - Le Pet Sitter saisit ce code (`enter_dropoff_code`) : la mission passe `in_progress` et sa part est **retenue** dans `wallet_entries`.
  - Le Pet Sitter génère à tout moment le code de fin (`generate_pickup_code`, avec le motif `early_owner` ou `early_sitter` avant le dernier jour). L'Owner le saisit dans le chat (`enter_pickup_code`) : la mission se règle (prorata si le Pet Sitter se désiste, aucun remboursement si l'Owner vient plus tôt), la part devient **disponible**, les Paw Points sont crédités, puis `request_payout`.
  - **Annulation avant la remise** (`cancel_mission`) : remboursement de 100 % au-delà de 14 jours, 75 % de 3 à 14 jours, 50 % de 24 à 72 h, 0 % sous 24 h. Si le Pet Sitter annule, remboursement de 100 %. Le Pet Sitter peut renoncer aux frais (`waive_cancellation_fee`), mais **les 5 % de 4PetsGo restent facturés à l'Owner** : ils ne sont jamais remboursés quand l'Owner annule. Si le Pet Sitter se désiste en cours de mission, les 5 % de frais de l'Owner sont remboursés en totalité. La règle existe en miroir côté client dans `features/booking/cancellation.ts`.
  - **Chat** : texte et fichiers (`mission-files` : images, PDF, Word, texte ; 20 Mo maximum ; chemin `{mission_id}/…`). **Messages immuables** : ni modification ni suppression, garanti par la RLS (aucune policy update/delete) et par le trigger `messages_immutable`. Seul le serveur peut y toucher. Les fichiers non plus ne sont jamais supprimables par les utilisateurs.
  - **Écran du chat** (`app/mission/[id].tsx`) : mise en page inspirée de WhatsApp, avec les couleurs 4PetsGo. Bulles à droite pour soi (`bubbleOwn`), à gauche pour l'autre (`bubbleOther`), heure et double coche, puces système centrées, pièce jointe et appareil photo dans la barre de saisie, bouton « Codes » dans l'en-tête (code de remise avec avertissement). La **carte First Night Update** n'apparaît **qu'après la remise de l'animal**, c'est-à-dire une fois le code de remise saisi par le Pet Sitter (`enterDropoffCode` côté app, `submit_first_night_update` côté serveur, qui exige le statut `in_progress`). Elle affiche « En attente » avant la réponse. Après la réponse, son bord passe au vert et elle montre une **coche verte et la récompense en Paw Points dans le coin supérieur droit**. Récompense (règle du fondateur du 25/11/2026, valeurs ⚠️ indicatives) : base de 5, ou de 8 si le commentaire compte **plus de 15 mots**, plus 1 par question répondue, soit **7 ou 10 Paw Points** (`firstNightReward`, et la même règle en SQL). Le formulaire affiche un compteur incitatif : « Écrivez plus de 15 mots pour gagner 10 Paw Points au lieu de 7 ». En phase 1 et 2, le chat est local (bouton « Confirmer la mission » sur la demande verrouillée). En développement, un sélecteur « Mode démo · Vue Owner / Pet Sitter » affiche la même conversation des deux côtés. Côté Pet Sitter, la feuille « Codes » sert à saisir le code de remise, puis à générer le code de fin de mission (avec un motif obligatoire avant le dernier jour). Côté Owner, elle sert à saisir ce code de fin (`MissionCodes`). Il sera branché sur `public.messages` et `mission-files`.
  - **Avis bilatéraux** (`submit_review`) : possibles seulement après une mission `completed`, un par partie, avec **4 critères notés de 1 à 5** : Owner → Pet Sitter (soins, communication, ponctualité, expérience générale) et Pet Sitter → Owner (ponctualité, communication, respect des accords, organisation de la remise et de la récupération). Ils sont **masqués à l'autre partie** jusqu'à ce que les deux aient évalué, ou 14 jours après la fin (`private.review_is_published`, tâche quotidienne `publish_due_reviews`). Une fois publiés, les membres connectés peuvent les lire. La note du Pet Sitter est la moyenne des avis publiés des Owners. Aucune modification, aucune suppression, aucune suspension automatique.
  - **Photos toutes les 48 h** : le créneau k tombe à remise + k × 48 h (tant que c'est avant la fin du séjour). Il est validé par **une** photo du Pet Sitter envoyée dans sa fenêtre (jusqu'à 6 h après l'échéance), et une même photo ne compte jamais pour deux créneaux. Le rappel s'affiche 12 h avant l'échéance. Côté app : `photoSchedule` et le bandeau `PhotoReminderBanner` sous l'en-tête du chat (J2, J4, J6, puis bouton « Envoyer » pour le Pet Sitter, et « Prochaine photo de … » pour l'Owner). Côté serveur : `private.photo_reminders_due()`, exécuté toutes les heures, poste les événements `photo_due` et `photo_late`. En développement, le bouton « +24 h » de la barre de démo avance l'horloge du chat.
  - **Écran d'avis** : quand la mission est terminée, la carte `ReviewCard` apparaît dans le chat (« Donner mon avis » → 4 critères en étoiles et un commentaire). Elle affiche ensuite « Votre avis est enregistré… », puis « Avis publiés » une fois que les deux parties ont évalué.
  - Les codes vivent dans `mission_codes`, sans aucune policy (accès uniquement par RPC), avec 5 essais maximum. Ils n'apparaissent jamais dans les messages ni dans les notifications.
- **Argent en centimes entiers** (`number` en centimes), arrondi au centime à chaque étape. Devise : EUR pour la France, CHF pour la Suisse, selon le pays de l'Owner.
- **La logique métier est pure et testée** (pricing, négociation, classement). Les écrans ne font qu'appeler ces fonctions. En phase 2, le verrouillage et les règles de négociation seront ré-implémentés **côté serveur** (fonction Postgres transactionnelle et RLS), et les fonctions TypeScript serviront à l'affichage.
- **Configuration tarifaire** dans `src/features/pricing/config.ts` : elle deviendra une table `pricing_config` en phase 2.
- **Bibliothèque de races** dans `src/features/pets/breeds.ts`, avec un champ `image`. Elle deviendra une table `breeds` et un bucket Storage administrable en phase 2. Tant qu'aucune photo studio sous licence n'est disponible, une image générique chien ou chat sur fond blanc est utilisée.
- **Sélecteurs de test** : chaque élément interactif clé porte un `testID` (devient `data-testid` sur le web). Argent et Playwright s'appuient dessus.
- **Feuilles modales** : utiliser `Sheet`, `ActionSheet` ou `ConfirmSheet` (basées sur `Modal`), jamais `Alert.alert` avec des boutons (sans effet sur le web).
- **Mode démo** (phase 1 uniquement) : sur l'écran d'une demande, un panneau « Répondre en tant que Pet Sitter » simule les réponses des Pet Sitters de démonstration. Il sera retiré en phase 2.
- **Interprétations encore à valider** (voir PRD §9) :
  - les frais Owner et la commission s'appliquent aussi aux frais kilométriques du Dog Walking ;
  - le prix minimum des Home Visits est compté par jour ;
  - la simulation Owner Club applique −10 % sur le prix du service, puis les frais Owner de 5 % ;
  - un seul tarif journalier par gabarit est saisi pour la garde et les visites ;
  - les prix suisses validés résultent de deux arrondis successifs aux 10 centimes (voir le test dans `pricing.test.ts`).

## Environnement

- Les sessions cloud Claude Code tournent sous Linux : ni Xcode, ni simulateur. On y teste avec Expo Web + Playwright (Chromium préinstallé).
- `api.expo.dev` et `docs.expo.dev` peuvent être bloqués par le proxy : utiliser `EXPO_OFFLINE=1` pour `expo install` et `expo start`.

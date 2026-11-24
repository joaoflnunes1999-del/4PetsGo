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
- Police : Inter uniquement (hiérarchie par la graisse et la taille), via `@expo-google-fonts/inter`.
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
- **Identité visuelle** (validée le 24/11/2026, remplace les versions précédentes) : moderne, minimaliste, premium, chaleureuse, naturelle et élégante, avec la simplicité de Vinted et d'Uber. **Le terracotta domine.** Le bleu et le sauge s'utilisent avec modération.

  | Couleur | Rôle | Token |
  |---|---|---|
  | Burnt Terracotta `#B9674E` | marque, boutons d'action, accents | `colors.action`, `colors.brand` |
  | Clay Brown `#854B3A` | contrastes, profondeur | `colors.secondary` |
  | Warm Ivory `#F7F2EA` | fond principal | `colors.background` |
  | Soft Sand `#E9D8C9` | fonds secondaires, zones de contenu | `colors.surfaceMuted` |
  | Dusty Blue `#718B9C` | filtres, sélection, certaines icônes, infos secondaires | `colors.selected*`, `colors.info` |
  | Sage Green `#A8B09A` | éléments positifs, détails naturels | `colors.success*` |
  | Charcoal `#35312E` | textes et titres | `colors.text` |
  | Muted Gold `#D5AD79` | récompenses, Paw Points, petits détails | `colors.accent*` |

  - **Cartes blanches** (`colors.surface`) sur fond ivoire.
  - Toutes les variantes (échelles 50 à 700) sont dans `palette`, dans `src/theme/tokens.ts`. Les écrans n'utilisent que les tokens sémantiques `colors.*`. Aucune couleur en dur hors de `src/theme`.
  - **Contraste** : un texte blanc sur terracotta 500 donne 4,1:1, donc les libellés de boutons sont en Bold 16 (variante `button`). Le texte et les petites icônes de couleur utilisent toujours la teinte 700 de leur famille (≥ 4,6:1).
  - Typographie : Inter uniquement, en Regular, Medium, SemiBold et Bold (`fontFamily`, `typography`). Coins légèrement arrondis (10 px), espacements généreux (20 px), icônes simples (Feather).
  - **Badges de niveau et de confiance** : écrits avec une majuscule initiale (« Expert », « Identité vérifiée »), jamais en capitales, **en gras**, en charbon (variante `badge`). Les étoiles d'avis sont **pleines**, en Muted Gold (`colors.accent`).
  - **Niveaux** : chaque niveau a son emblème, une patte numérotée de 1 à 5 (`assets/images/levels/*.png`, composant `LevelIcon`, au moins 24 px pour que le chiffre reste lisible). **Unité Paw Points** : la pièce `assets/images/paw-coin.png` (composant `PawCoin`). On n'utilise plus d'icône de patte générique pour les Paw Points.
  - **Commission** : elle n'apparaît pas sur le profil du Pet Sitter. Elle n'est expliquée que dans la feuille d'information des niveaux (bouton « i » sous les 5 pattes, `LevelsInfoSheet`), avec des valeurs lues dans `pricing/config.ts`.
  - **Skin Owner Club** : couronne `mci:crown` pleine en Muted Gold, sur le cercle de la photo de l'Owner, à environ 20° dans le sens horaire et inclinée de 20° (`OwnerAvatar`, calcul dans `features/owners/crown.ts`). En phase 1, un interrupteur « Mode démo », visible seulement en développement dans l'onglet Profil, simule l'abonnement. Le vrai achat arrive avec Superwall en phase 3.
  - Photos de profil parfaitement circulaires, pour les utilisateurs comme pour les animaux. Les photos de la galerie restent carrées.
  - **Logo officiel** (fourni le 24/11/2026) : maison et patte en terracotta, « 4Pets » en charbon, « Go » en sauge, sur fond ivoire. Il sert d'icône d'app, de splash, de favicon et d'icône Android, avec le fond en Warm Ivory. Dans l'app, il passe par le composant `Logo` (`logo-mark.png`).
- **Profil Pet Sitter** : en haut, prénom, âge, ville et distance, puis **4 tuiles compactes** (`KeyTiles`, environ 10 % de l'écran, icône et valeur courte, sans libellé) : logement (icône maison ou immeuble, avec la surface), extérieur, enfants, animaux au foyer. Pour un Pet Sitter sans garde : rayon, expérience, missions, nombre de chiens. Ensuite la présentation, puis les services. **Aucun tarif sur le profil ni sur les cartes de résultats** : le prix apparaît seulement dans la demande, où il est négocié.
- **Prix minimum** : pour chaque animal, `MIN_DAILY_PRICE[pays][gabarit]`, où le gabarit vient du **poids, obligatoire pour un chien** (règle appliquée dans l'app et par la contrainte `pets_dog_weight_required`). Le repli sur `breeds.typical_size` ne sert que de filet de sécurité. Le minimum de la demande est la somme sur tous les animaux, multipliée par le nombre de jours. L'Owner ne peut jamais proposer moins, et aucune contre-proposition ne peut descendre sous ce montant. La règle est appliquée dans l'app (`floorFor`) **et** sur le serveur (`private.request_floor_cents`).
- **Visibilité** (décision du 25/11/2026) : le profil de l'animal et sa galerie sont **publics pour les membres connectés** (comme Instagram). Il n'y a plus de réglage de confidentialité. **Données sensibles** : photos de mission (chat, rapports, First Night Update) et `pet_care`, visibles seulement par l'Owner et le Pet Sitter d'une mission confirmée, pendant la mission.
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

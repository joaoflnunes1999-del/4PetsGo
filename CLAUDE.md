# 4PetsGo — CLAUDE.md

Marketplace iOS reliant Owners (propriétaires d'animaux) et Pet Sitters, en France et en Suisse.
Docs produit : [`docs/PRD.md`](docs/PRD.md) · [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Phase actuelle : Phase 1**, avec des données locales uniquement (aucun backend).

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
EXPO_OFFLINE=1 npx expo install <pkg>   # ajouter une dépendance compatible avec le SDK (offline si api.expo.dev est bloqué)
```

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, Expo Router (routes typées), TypeScript strict, React Compiler activé.
- État local : **Zustand** + `persist` (AsyncStorage). Ce stockage sera remplacé par Supabase en phase 2.
- Polices : Fraunces (titres, côté émotionnel) + Inter (texte), via `@expo-google-fonts`.
- Icônes : `@expo/vector-icons` (Feather et MaterialCommunityIcons).
- Images : `expo-image` pour l'affichage, `expo-image-picker` pour la caméra et la photothèque.
- Tests : Jest (`jest-expo`) pour la logique pure, dans `src/features/**/__tests__`.
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
- **Argent en centimes entiers** (`number` en centimes), arrondi au centime à chaque étape. Devise : EUR pour la France, CHF pour la Suisse, selon le pays de l'Owner.
- **La logique métier est pure et testée** (pricing, négociation, classement). Les écrans ne font qu'appeler ces fonctions. En phase 2, le verrouillage et les règles de négociation seront ré-implémentés **côté serveur** (fonction Postgres transactionnelle et RLS), et les fonctions TypeScript serviront à l'affichage.
- **Configuration tarifaire** dans `src/features/pricing/config.ts` : elle deviendra une table `pricing_config` en phase 2.
- **Bibliothèque de races** dans `src/features/pets/breeds.ts`, avec un champ `image`. Elle deviendra une table `breeds` et un bucket Storage administrable en phase 2. Tant qu'aucune photo studio sous licence n'est disponible, une image générique chien ou chat sur fond blanc est utilisée.
- **Mode démo** (phase 1 uniquement) : sur l'écran d'une demande, un panneau « Répondre en tant que Pet Sitter » simule les réponses des Pet Sitters de démonstration. Il sera retiré en phase 2.
- **Interprétations encore à valider** (voir PRD §9) :
  - les frais Owner et la commission s'appliquent aussi aux frais kilométriques du Dog Walking ;
  - le prix minimum des Home Visits est compté par jour ;
  - la simulation Owner Club applique −10 % sur le prix du service, puis les frais Owner de 5 %.

## Environnement

- Les sessions cloud Claude Code tournent sous Linux : ni Xcode, ni simulateur. On y teste avec Expo Web + Playwright (Chromium préinstallé).
- `api.expo.dev` et `docs.expo.dev` peuvent être bloqués par le proxy : utiliser `EXPO_OFFLINE=1` pour `expo install` et `expo start`.

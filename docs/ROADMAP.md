# 4PetsGo — Roadmap

Construite à partir de [`PRD.md`](./PRD.md). Chaque phase commence par un **plan de travail court**, soumis à l'approbation du fondateur. Une fonctionnalité n'est considérée comme terminée qu'après avoir été **testée dans le simulateur iPhone** (Argent). Un commit est fait par fonctionnalité opérationnelle.

> **Action principale** : *un Owner envoie une demande pour son animal, négocie avec des Pet Sitters et obtient une mission verrouillée.*

---

## Phase 1 — L'action principale fonctionne en local ✅ (terminée le 24/11/2026, testée sur Expo Web, test iOS/Argent en attente d'un Mac)

**But** : dans le simulateur, un Owner crée le profil de son animal, trouve des Pet Sitters, envoie une demande, négocie, et la mission se verrouille. Tout fonctionne avec des **données locales** (stockage sur l'appareil et Pet Sitters de démonstration).

- Projet Expo (Router + TypeScript), outils de qualité (lint, typecheck, tests unitaires), `CLAUDE.md`.
- **Design system** : couleurs, typographie, espacements, rayons, ombres et composants de base (Button, Input, Card, Avatar, Chip, Tabs, Sheet).
- Navigation principale : accueil, choix du rôle, onglets (Mes animaux · Rechercher · Missions · Profil).
- **Profil de l'animal** : espèce → race avec recherche → photo de race automatique (bibliothèque locale de départ et images génériques), formulaire en 4 onglets (Présentation, Personnalité, Routine, Soins), réglage de confidentialité.
- **Galerie** : grille de 3 colonnes, import multiple, appareil photo, plein écran avec balayage, légende, suppression, choix de la photo principale.
- **Recherche** : Pet Sitters de démonstration, filtres par service, dates et animal, classement (compatibilité → proximité → avis → Paw Points), profil Pet Sitter avec sections dynamiques.
- **Moteur de prix** (logique pure, testée unitairement) : prix minimums FR et CH, frais Owner de 5 %, commission selon le niveau, kilomètres du Dog Walking, simulation Owner Club.
- **Demande et négociation** : envoi à plusieurs Pet Sitters, 3 allers-retours, expiration à 48 h, prix plancher, **verrouillage** dès le premier accord.
- **Mode démo « Voir en tant que Pet Sitter »** : un sélecteur de rôle, réservé au mode développement, pour répondre aux demandes et tester la négociation des deux côtés sans backend. Il est retiré dès la phase 2.

**Critère de fin** : le parcours de l'accueil jusqu'à la mission verrouillée fonctionne dans le simulateur, chaque bouton fait réellement quelque chose, et les tests unitaires du moteur de prix et de la négociation passent.

---

## Phase 2 — Comptes, base de données et synchronisation

**But** : de vrais utilisateurs, de vraies données, partagées entre Owners et Pet Sitters.

- **Supabase** : schéma PostgreSQL (profiles, pets, pet_photos, breeds, sitter_services, availability, booking_requests, offers, missions, mission_events, messages, reviews, paw_points_ledger, pricing_config). **RLS sur toutes les tables.**
- **Se connecter avec Apple** (Supabase Auth). Choix du rôle enregistré.
- **Supabase Storage** : buckets pour les photos des animaux, les photos de mission et la bibliothèque de races, avec des politiques d'accès selon la confidentialité et la réservation. Images compressées et redimensionnées à l'envoi, chargées en différé (lazy loading).
- **Verrouillage atomique de la mission** : fonction PostgreSQL transactionnelle (verrouillage de ligne et contrainte d'unicité), testée en concurrence.
- Expiration des offres à 48 h (tâche planifiée `pg_cron`).
- **Accès sensible** : soins, adresse et codes visibles par le Pet Sitter uniquement pendant une mission confirmée, avec un journal des accès.
- **Chat de mission** en temps réel (Supabase Realtime), chronologie des événements, photos de mission, rappels toutes les 48 h, First Night Update.
- **Paw Points** (registre crédité à la fin de la mission, ×1,5 Owner Club), niveaux, **avis bilatéraux** masqués.
- Notifications push (Expo Notifications), sans aucun code d'accès dans leur contenu.
- **Suppression du compte** dans l'application (Edge Function).
- Les données locales de la phase 1 sont remplacées par la synchronisation, et le mode démo est retiré.

**Critère de fin** : deux comptes réels (un Owner et un Pet Sitter), sur deux simulateurs, vont de la demande jusqu'à la mission terminée et l'avis. Les tests RLS prouvent qu'un tiers ne peut lire ni les soins, ni les adresses, ni les photos privées.

---

## Phase 3 — Onboarding, paiement, paywall et analytics → TestFlight

**But** : une version que l'on peut confier à de vrais testeurs.

- **Onboarding** final des Owners et des Pet Sitters : écrans d'accueil, justification de chaque autorisation au moment où elle est nécessaire.
- **Stripe Connect** : onboarding et KYC des Pet Sitters, paiement par l'Owner via une Edge Function, webhooks, remboursements selon la politique d'annulation (⚠️ à valider), versements.
- **Superwall + StoreKit** : carte Owner Club après l'acceptation de la mission, avec le prix réel, et bouton « Restaurer mes achats ». ⚠️ Le financement de la réduction de 10 % doit être décidé avant cette phase.
- **PostHog** : tous les événements du PRD et l'entonnoir allant de l'onboarding jusqu'à la mission payée.
- **Sentry** : erreurs et performances, avec les source maps.
- **Resend** : e-mails transactionnels depuis les Edge Functions.
- Build Xcode → **TestFlight**.

**Critère de fin** : un paiement en mode test Stripe et un achat Owner Club en mode sandbox réussissent de bout en bout sur TestFlight, et les événements remontent dans PostHog.

---

## Phase 4 — Finitions, optimisation et App Store

- Passe complète sur le design, les animations, les états vides, les erreurs et le mode hors ligne.
- Performance : images, listes, temps de démarrage.
- Audit de sécurité : RLS, Edge Functions, secrets, stockage.
- Politique de confidentialité et CGU (FR et CH), mentions RGPD et nLPD.
- Vérification de toutes les exigences Apple (suppression du compte, restauration des achats, aucun « Coming soon », textes des autorisations).
- Fiche App Store : captures d'écran, description, mots-clés, étiquette de confidentialité.
- Soumission et suivi de la review. **EAS Update** pour les corrections rapides compatibles.

---

## Après la V1 (V1.1 et suivantes)

- Abonnements Pet Sitter (Starter, Plus, Pro).
- Albums photo.
- Extras payants.
- Vérification des certifications.
- Section « Discover New Pet Sitters ».
- Trust & Reliability Score, niveaux des Owners.
- Android, langues DE et EN.

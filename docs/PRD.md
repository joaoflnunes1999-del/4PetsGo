# 4PetsGo — Product Requirements Document (V1)

> *Your Pet, their care, one place!*

| | |
|---|---|
| Statut | Validé par le fondateur (questions 1 à 10) — base de travail pour la roadmap |
| Date | 24 novembre 2026 |
| Marchés | France 🇫🇷 et Suisse 🇨🇭 (lancement ouvert, pas de ville pilote) |
| Langue | Français au lancement (architecture prête pour DE / EN) |
| Plateforme | iOS en priorité (Expo / React Native) |

Ce document décrit **ce que la première version publiée (V1) doit faire**. Tout ce qui est marqué **⚠️ À valider** est une proposition qui ne doit pas être considérée comme définitive avant validation explicite.

---

## 1. Le problème à résoudre

Confier son animal à quelqu'un est aujourd'hui une source de stress et de friction, pour trois raisons principales :

1. **L'information se perd.** À chaque nouveau Pet Sitter, l'Owner doit tout réexpliquer : vétérinaire, médicaments, habitudes, peurs, routine. Ces informations circulent par SMS, papiers ou messages vocaux, et des détails importants sont oubliés.
2. **Trouver une personne de confiance est difficile.** Les Owners ne savent pas comment évaluer un Pet Sitter inconnu, et les nouveaux Pet Sitters n'ont aucun moyen de prouver leur sérieux pour obtenir leurs premières missions.
3. **Le silence pendant la garde inquiète.** Une fois l'animal confié, l'Owner reçoit des nouvelles au bon vouloir du Pet Sitter, sans régularité.

À cela s'ajoute un manque sur le marché : **aucune application ne combine une négociation encadrée du prix de la garde et un système de progression des Pet Sitters** qui récompense l'engagement et crée la confiance.

### La proposition de 4PetsGo

- Un **profil permanent pour chaque animal** (photos, personnalité, routine, soins), partagé automatiquement et uniquement avec le Pet Sitter d'une réservation confirmée.
- Une **demande envoyée à plusieurs Pet Sitters**, avec une **négociation encadrée** (3 allers-retours, prix minimum garanti) et une mission verrouillée dès qu'un accord est trouvé.
- Un **suivi de mission rassurant** : chat dédié, chronologie, photo obligatoire toutes les 48 h, First Night Update.
- Un **système de progression (Paw Points, 5 niveaux)** qui motive les Pet Sitters et réduit leur commission à mesure qu'ils progressent.

---

## 2. Les utilisateurs cibles

Une seule application. L'utilisateur choisit son rôle à l'inscription.

### Owner — propriétaire d'un ou plusieurs chiens ou chats

- Particulier en France ou en Suisse, qui part en week-end, en vacances, en déplacement professionnel, ou qui travaille de longues journées.
- Attentes : confiance, simplicité, nouvelles régulières, prix juste.
- **Utilise toutes les fonctionnalités essentielles gratuitement.** Peut souscrire à l'**Owner Club** (annuel).

### Pet Sitter — prestataire de garde et de soins

- Particulier passionné, étudiant, retraité ou professionnel de l'animal (titulaire ACACED, FBA/FSIFP, CFC…).
- Peut proposer un ou plusieurs services depuis **un seul profil** :
  - **Pet Boarding** : garde chez le Pet Sitter.
  - **Home Visits** : visites au domicile de l'Owner.
  - **Dog Walking** : promenades.
- **Inscription ouverte à tous**, sans validation préalable en V1.
- Attentes : obtenir des missions rapidement, être payé de façon fiable, se démarquer.

---

## 3. Fonctionnalités principales (V1)

### 3.1 Comptes et rôles
- Connexion **« Se connecter avec Apple »**.
- Choix du rôle : Owner ou Pet Sitter.
- Profil public sans adresse exacte : ville, région et distance approximative uniquement.
- **Suppression du compte depuis l'application.**
- Politique de confidentialité et CGU accessibles dans l'application.

### 3.2 Profil individuel de l'animal
- Plusieurs animaux par Owner, chacun avec un **Pet ID** unique et un profil permanent, indépendant des réservations.
- **Espèce** (chien ou chat) → **race**, sélectionnée dans une liste avec recherche → **photo de race attribuée automatiquement**, sur fond blanc et au format 1:1, depuis une bibliothèque centralisée et administrable. Une image générique est utilisée pour les animaux croisés, les races inconnues ou les images manquantes.
- La photo par défaut est remplaçable à tout moment, depuis la caméra, la photothèque ou la galerie de l'animal.
- **En-tête du profil** : photo, nom, race, âge, nombre de photos, description courte.
- **Galerie** en grille carrée de 3 colonnes : import multiple, prise de photo, plein écran avec balayage, légende, modification, suppression, choix de la photo principale, ordre chronologique.
- **Onglets** :
  - **Présentation** : espèce, race, naissance ou âge estimé, sexe, poids, description.
  - **Personnalité** : traits, énergie, comportement avec les animaux et les enfants, socialisation, peurs, commandes connues.
  - **Routine** : alimentation, activités, promenades, sommeil, jouets.
  - **Soins** : vétérinaire (nom, téléphone, adresse facultative), numéro de puce, médicaments (nom, dosage, mode d'administration, fréquence, horaires).
- **Profil et galerie publics dans l'app** (décision du 25/11/2026, remplace les 3 niveaux de confidentialité) : comme sur Instagram, le profil de l'animal et ses photos sont visibles par tout membre connecté qui ouvre le profil. Seul l'Owner peut les modifier.
- **Données sensibles** : les **photos échangées pendant une mission** (chat, rapports, First Night Update) et les **données de soins** (vétérinaire, médicaments, puce). **Elles ne sont jamais publiques.** Elles sont visibles uniquement par l'Owner et par le Pet Sitter d'une réservation confirmée et en cours. Cette règle est appliquée **côté serveur (RLS)**.

### 3.3 Profil Pet Sitter
- Présentation, expérience, services proposés et zone d'intervention : rayon de 5, 10, 15, 20 ou 30 km.
- La section **« My Home & Environment »** n'apparaît que pour le Pet Boarding : type de logement, m², balcon, jardin et type de clôture, enfants, animaux résidents, séparation possible, espace de couchage, photos facultatives.
- Dog Walking : zones, durées proposées, nombre de chiens simultanés.
- Disponibilités sous forme de calendrier simple.
- **Certifications & Qualifications** : déclarées, avec document justificatif et statut « En attente de vérification ».
- Niveau, Paw Points et avis affichés sur le profil.

### 3.4 Recherche et classement
- Filtres : service, dates, localisation, espèce et gabarit de l'animal.
- Ordre du classement : **compatibilité du service et disponibilité** (critère éliminatoire), puis **proximité** (critère majeur), puis **avis**, puis **Paw Points** (pour départager des profils similaires uniquement).
- **New Sitter Boost** : visibilité accrue pendant les **2 premières missions**. Il est lié à une identité vérifiée et ne doit jamais faire passer un nouveau Pet Sitter devant un profil nettement plus proche ou plus adapté.
- Un abonnement payant ne garantit **jamais** une meilleure position.

### 3.5 Demande, négociation et verrouillage de la mission ⭐ (différenciateur)
1. L'Owner choisit le service, les dates et **le ou les animaux concernés**, puis envoie sa demande à **un ou plusieurs Pet Sitters**.
2. Chaque demande possède un **identifiant de mission unique**.
3. Chaque Pet Sitter peut **accepter**, **refuser** ou faire une **contre-offre**.
4. **Négociation** : jusqu'à **3 allers-retours** par Pet Sitter. Chaque offre **expire au bout de 48 h** sans réponse. L'historique des offres reste visible.
5. Une offre ne peut **jamais descendre sous le prix minimum** du service (voir 3.6). Ce minimum vaut, pour chaque animal, le tarif de son gabarit (selon son poids, ou selon sa race si le poids n'est pas renseigné), multiplié par le nombre de jours. Cette règle s'applique à la proposition initiale de l'Owner comme à chaque contre-proposition, dans l'app et sur le serveur.
6. **Verrouillage** : dès qu'un accord est conclu entre l'Owner et un Pet Sitter, la mission est verrouillée **de façon atomique côté serveur**. Toutes les autres offres sont automatiquement clôturées, et aucun autre Pet Sitter ne peut plus accepter.
7. L'Owner voit le récapitulatif du prix → **carte Owner Club** (paywall, voir 3.8) → paiement → **mission confirmée**.

### 3.6 Tarification

**Prix minimum par jour**, valable pour le Pet Boarding et les Home Visits :

| Catégorie | France (EUR) | Suisse (CHF) |
|---|---|---|
| Chat | 8,50 | 20,20 |
| Petit chien (0–10 kg) | 9,00 | 21,40 |
| Chien moyen (10–25 kg) | 11,00 | 26,10 |
| Grand chien (25–40 kg) | 13,00 | 30,80 |
| Très grand chien (+40 kg) | 17,00 | 40,30 |

*Les prix suisses viennent des prix français multipliés par 4 000 / 1 350, puis réduits de 20 %.*

- Le Pet Sitter fixe librement son tarif **au-dessus** du minimum.
- **Dog Walking** : prix de la promenade **libre et négocié**, plus des **frais kilométriques automatiques** calculés sur l'aller-retour entre l'Owner et le Pet Sitter : **0,37 €/km** en France, **0,45 CHF/km** en Suisse.
- Tous les montants sont stockés dans une **table de configuration**, pas en dur dans le code.

**Commission de la plateforme**

| | Taux |
|---|---|
| Frais Owner (ajoutés au prix) | **5 %**, fixe |
| Commission Pet Sitter (déduite) | **Beginner 5 % · Explorer 4 % · Advanced 3 % · Expert 2 % · Master 1 %** |

*Exemple pour une garde de 210 € réalisée par un Pet Sitter Master : l'Owner paie 220,50 €, le Pet Sitter reçoit 207,90 € et la plateforme encaisse 12,60 €.*

### 3.7 Paiement
- **Stripe Connect** pour le paiement des gardes (service réel entre deux personnes, donc **hors achats intégrés Apple**).
- Paiement intégral à la confirmation, puis versement au Pet Sitter selon les règles Stripe. La plateforme ne présente pas ce mécanisme comme un « séquestre » (escrow).
- KYC des Pet Sitters réalisé par Stripe au premier versement. Il sert aussi de base à l'« identité vérifiée » du New Sitter Boost.
- **Annulation** : ⚠️ À valider, appliquée en V1 sous forme de proposition :
  - plus de 7 jours avant la mission : 100 % remboursé ;
  - de 3 à 7 jours : 75 % ;
  - de 24 à 72 h : 50 % ;
  - moins de 24 h : 0 %.
- Pour chaque annulation, l'application enregistre l'auteur, le motif et l'horodatage. Le Pet Sitter peut signaler une annulation faite à la demande de l'Owner, qui peut la confirmer ou la contester. Les désaccords sont revus manuellement.

### 3.8 Owner Club — le seul paywall de la V1
- Abonnement annuel **49,99 €/an**, vendu via **Superwall + StoreKit** (achat intégré Apple).
- **Moment d'affichage** : uniquement côté Owner, **après qu'un Pet Sitter a accepté la mission et avant le paiement**. Il prend la forme d'une **petite carte, non bloquante**, qui reprend le **prix réel de la mission**.
  - *Exemple : « Avec l'Owner Club, cette garde vous coûterait 198,45 € au lieu de 220,50 €. »*
- Avantages : **−10 % sur les services éligibles** (⚠️ financement à valider, voir section 8), support prioritaire.
- **Skin Owner Club** : une couronne pleine en Muted Gold est affichée en permanence sur la photo de profil de l'Owner, posée sur le cercle à environ 20° dans le sens des aiguilles d'une montre (validé le 24/11/2026).
- **Effet pour le Pet Sitter** : les missions d'un Owner Club rapportent **×1,5 Paw Points**. Ce bonus est visible avant l'acceptation et crédité à la fin de la mission. Il ne s'applique qu'aux points de la mission.
- Bouton **« Restaurer mes achats »** dans les réglages.

### 3.9 Chat et suivi de mission
- Le chat se débloque automatiquement **après le paiement**.
- On y trouve des messages, des photos et une **chronologie des événements** : réservation confirmée, mission commencée, photo, rapport, médicament administré, mission terminée.
- **Adresse exacte** révélée dans le chat uniquement après le paiement : adresse du Pet Sitter pour le Pet Boarding, de l'Owner pour les Home Visits, point de rendez-vous pour le Dog Walking.
- **Codes d'accès** consultables uniquement dans le chat authentifié, **jamais dans une notification**.
- **Photo obligatoire toutes les 48 h**, avec rappels automatiques, plus un rapport final.
- **First Night Update** : le lendemain matin de la première nuit, le Pet Sitter remplit un questionnaire court (2 questions, un commentaire et une photo facultatifs).
- **Photos de mission ≠ galerie personnelle** : l'Owner peut copier une photo de mission dans la galerie de son animal, mais rien n'y est ajouté automatiquement.
- L'accès du Pet Sitter au profil et aux soins de l'animal est **révoqué** à l'annulation de la mission ou à la fin de la période autorisée.

### 3.10 Paw Points et niveaux 🐾
- 5 niveaux, chacun représenté par une **patte numérotée de 1 à 5** (visuels fournis par le fondateur le 24/11/2026, qui remplacent les animaux) :

| Niveau | Emblème | Paw Points (⚠️ seuils indicatifs) | Commission |
|---|---|---|---|
| Beginner | Patte n° 1 | 0–199 | 5 % |
| Explorer | Patte n° 2 | 200–599 | 4 % |
| Advanced | Patte n° 3 | 600–1 499 | 3 % |
| Expert | Patte n° 4 | 1 500–2 999 | 2 % |
| Master | Patte n° 5 | 3 000+ | 1 % |

- **Unité Paw Points** : représentée par la pièce « paw coin » (bord terracotta, face dorée, patte).

- Récompenses ⚠️ indicatives et configurables :
  - mission terminée : +30 ;
  - première mission : bonus ;
  - profil complet : +20 ;
  - photo de suivi prévue : +2 ;
  - 5 missions consécutives sans incident : +30.
- Les points sont crédités **après** la réalisation de la mission. Le terme « XP » n'est jamais utilisé.
- **Les Paw Points ne mesurent pas la fiabilité.** La confiance repose sur les avis.

### 3.11 Avis bilatéraux
- Uniquement après une mission réellement terminée.
- L'Owner évalue le Pet Sitter, et inversement, sur les critères listés dans le document projet.
- Les avis sont **masqués jusqu'à ce que les deux parties aient répondu**, ou jusqu'à la fin d'un délai de 14 jours.
- En V1, on affiche une note moyenne et des commentaires, **sans score calculé**. Aucune suspension automatique.

### 3.12 Notifications et e-mails
- Notifications push : nouvelle demande, contre-offre, offre bientôt expirée, mission acceptée, paiement, rappel photo, First Night Update, avis.
- E-mails transactionnels envoyés par **Resend** depuis les Edge Functions : confirmation de réservation, reçu, annulation.
- **Chaque demande d'autorisation** (caméra, photos, notifications, localisation) est accompagnée d'une justification claire, au moment où elle devient nécessaire.

---

## 4. Fonctionnalités exclues de la V1

| Exclu | Raison | Prévu pour |
|---|---|---|
| Abonnements Pet Sitter Starter, Plus et Pro (tous les Pet Sitters sont en Free) | Il faut d'abord des Pet Sitters actifs ; les avantages ne sont pas encore finalisés. | V1.1 |
| Multiplicateurs de Paw Points liés aux abonnements Pet Sitter | Non validé. | À décider |
| Niveaux des Owners (New → VIP) | Critères non définis. | V1.2 |
| Trust & Reliability Score calculé | Critères non définis. La V1 affiche les avis. | V1.2 |
| Vérification administrative des certifications | Règles différentes selon le pays et le canton. | V1.1 |
| Albums photo | La galerie chronologique suffit au lancement. | V1.1 |
| Section « Discover New Pet Sitters Near You » | Le New Sitter Boost couvre ce besoin dans la recherche. | V1.1 |
| Extras payants (médicaments, soins spécifiques) | Commission non définie. | V1.1 |
| Lien personnel de réservation, facturation, statistiques avancées | Fonctionnalités des abonnements Pet Sitter. | V1.1 |
| Android, langues DE et EN, autres espèces | Priorité à iOS et au français. | Plus tard |
| Essai gratuit de l'Owner Club | ⚠️ À valider. | À décider |

> Conformément aux règles d'Apple, **aucun écran n'affiche « Bientôt disponible »**. Les fonctionnalités exclues sont tout simplement absentes de l'application.

---

## 5. Parcours utilisateur — du premier écran au paywall

### Parcours Owner (parcours principal)

```
1. Écran d'accueil ─ slogan, 3 visuels (profil animal · suivi de mission · confiance)
        │
2. « Se connecter avec Apple »
        │
3. Choix du rôle ─ « J'ai un animal » / « Je suis Pet Sitter »
        │
4. Prénom + ville / code postal (pays déduit : FR ou CH)
        │
5. Création du 1er animal
   espèce → race (recherche) → photo de race affichée automatiquement
   → nom, date de naissance, sexe, poids
        │
6. Profil de l'animal créé 🎉  (galerie vide, invitation à ajouter des photos)
   [compléter personnalité / routine / soins : possible maintenant ou plus tard]
        │                                     ── fin de l'onboarding (événement PostHog)
7. Recherche ─ service, dates, animal(aux) → liste de Pet Sitters classés
        │
8. Profil d'un Pet Sitter → « Envoyer une demande » (1 ou plusieurs Pet Sitters)
        │
9. Négociation ─ offres / contre-offres (max 3, expiration 48 h)
        │
10. Un Pet Sitter accepte → mission verrouillée
        │
11. Récapitulatif du prix
    ┌──────────────────────────────────────────────┐
    │ 💳 PAYWALL : carte Owner Club                │
    │ « Avec l'Owner Club : 198,45 € au lieu de     │
    │   220,50 € » [Rejoindre] [Continuer]          │
    └──────────────────────────────────────────────┘
        │
12. Paiement (Stripe) → mission confirmée → chat débloqué
```

### Parcours Pet Sitter

```
Accueil → Se connecter avec Apple → « Je suis Pet Sitter »
→ services proposés (Boarding / Visits / Walking)
→ sections dynamiques (logement si Boarding, rayon, durées…)
→ tarifs (≥ prix minimum) + disponibilités
→ profil publié — niveau Beginner 🐤, New Sitter Boost actif
→ réception d'une demande → accepter / refuser / contre-offre
→ mission payée → chat, accès au profil de l'animal et aux soins
→ photos toutes les 48 h, First Night Update → fin de mission → Paw Points + avis
→ premier versement : vérification d'identité Stripe
```

---

## 6. Indicateurs de succès

Suivis dans **PostHog**. Les objectifs sont fixés à 3 mois après la publication.

| Indicateur | Objectif |
|---|---|
| Pet Sitters inscrits avec un profil complet | **50** |
| Owners ayant créé au moins un profil d'animal | **300** |
| Taux de demandes aboutissant à une réservation payée | **≥ 30 %** |
| Délai médian entre la demande et la première réponse d'un Pet Sitter | **< 12 h** |
| Conversion à l'Owner Club après affichage du paywall | **≥ 5 %** |
| Owners réservant une 2ᵉ fois sous 60 jours | **≥ 25 %** |
| Missions avec toutes les photos obligatoires (toutes les 48 h) | **≥ 90 %** |

**Événements PostHog** : `app_opened`, `signed_up`, `role_selected`, `onboarding_completed`, `pet_profile_created`, `pet_photo_added`, `sitter_search_performed`, `booking_request_sent`, `offer_countered`, `offer_accepted`, `paywall_shown`, `owner_club_subscribed`, `payment_completed`, `mission_completed`, `review_submitted`.

**Action principale** (*north star*) : **une mission payée puis terminée.**

---

## 7. Contraintes non négociables

- Aucune clé secrète (Supabase service role, Stripe secret, Resend, OpenAI ou Claude) dans l'application. Ces clés vivent uniquement dans les **Edge Functions**.
- **RLS sur toutes les tables.** Les permissions sur les photos, les soins, les adresses et les codes sont appliquées par la base de données, pas seulement par l'interface.
- Exigences Apple : Se connecter avec Apple, suppression du compte dans l'application, politique de confidentialité et CGU, bouton « Restaurer mes achats », aucun « Coming soon », justification de chaque autorisation.
- Respect du **RGPD** et de la **nLPD suisse** : minimisation des données, droit à l'effacement, durée de conservation (⚠️ à définir).
- **Design system centralisé** dès le premier jour.

---

## 8. Risques et points d'attention identifiés

1. **💰 La réduction Owner Club de 10 % peut coûter plus que ce que gagne la plateforme.** Sur une garde de 210 €, la réduction vaut 21 €. La plateforme encaisse entre 21 € (Pet Sitter Beginner, 5 % + 5 %) et 12,60 € (Pet Sitter Master, 5 % + 1 %), avant les frais Stripe (environ 1,5 % + 0,25 €). Si la plateforme finance seule la réduction, **elle perd de l'argent sur chaque réservation Owner Club**, sauf avec un Pet Sitter Beginner, où elle est à zéro. Pistes : réduction appliquée uniquement sur les frais Owner, réduction plafonnée (par exemple 10 € par mission), ou réduction de 10 % sur les frais seulement. **⚠️ Décision à prendre avant la phase 3.**
2. **Commission de 1 % au niveau Master** : avec les frais Stripe, la marge de la plateforme sur ces missions repose presque entièrement sur les 5 % payés par l'Owner.
3. **Apple** prélève 15 % (Small Business Program) à 30 % sur l'Owner Club. Le revenu net est d'environ 42,49 € par an et par abonné.
4. **Bibliothèque de photos de races** : il faut des photos studio sous licence (banque d'images payante, séance photo ou génération par IA avec des droits clairs). En phase 1, la bibliothèque démarre avec les races les plus courantes et une image générique.
5. **Stripe Connect** est disponible en France et en Suisse, mais les paiements entre un compte CHF et un compte EUR, les litiges et les délais de versement doivent être testés.
6. **Une marketplace sans ville pilote** risque d'avoir peu de Pet Sitters par zone au lancement. Il faut suivre la densité par ville dans PostHog.
7. **Inscription ouverte** des Pet Sitters : la confiance repose en V1 sur les avis, le KYC Stripe et les certifications déclarées. La modération se fait manuellement, sur signalement.
8. **Environnement de développement** : le simulateur iOS, Argent et Xcode nécessitent un **Mac**. Le développement cloud (Linux) ne permet pas de les lancer. Un Mac doit être connecté pour les tests sur simulateur et les builds TestFlight.

---

## 9. Points ouverts (⚠️ à valider avant la mise en production)

1. Politique définitive d'annulation et de remboursement.
2. Financement de la réduction Owner Club de 10 % (voir risque n°1).
3. Essai gratuit de l'Owner Club.
4. Contenu et prix des abonnements Pet Sitter (V1.1).
5. Seuils et valeurs définitives des Paw Points.
6. Unité de prix des Home Visits : par jour (V1) ou par visite ?
7. Durée de conservation des données et de l'accès après une mission.
8. Calendrier de versement aux Pet Sitters.
9. Durée exacte du délai de publication des avis (14 jours proposés).

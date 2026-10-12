import type { LucideIcon } from "lucide-react";
import { FileCheck2, Home, Key, Megaphone, ShieldCheck, Wrench } from "lucide-react";

export interface Domaine {
  id: string;
  /** Nom de fichier attendu dans public/images/domaines/ (sans le dossier). */
  image: string;
  icon: LucideIcon;
  titre: string;
  accroche: string;
  pointsForts: string[];
  cta: { label: string; to: string };
  /** Domaine mis en avant en grande carte (un seul recommandé). */
  phare?: boolean;
}

/**
 * Domaines d'intervention réellement proposés par l'agence, fondés sur les
 * modules existants (catalogue maisons, biens & services, mandats bailleurs,
 * annonces, demandes, documents officiels). Tableau typé pour rester
 * modifiable facilement, voire remplaçable par un appel API plus tard.
 */
export const DOMAINES: Domaine[] = [
  {
    id: "location-maisons",
    image: "location-maisons.webp",
    icon: Home,
    titre: "Location de maisons",
    accroche: "Trouvez votre prochain logement en toute confiance.",
    pointsForts: [
      "Catalogue de maisons vérifié par l'agence",
      "Disponibilité affichée en temps réel",
      "Réservation directe en ligne",
    ],
    cta: { label: "Voir le catalogue", to: "/catalogue" },
    phare: true,
  },
  {
    id: "biens-services",
    image: "biens-services.webp",
    icon: Wrench,
    titre: "Location de biens & services",
    accroche: "Louez ce dont vous avez besoin, sans les contraintes de l'achat.",
    pointsForts: [
      "Véhicules, équipements et services divers",
      "Demande confirmée par un agent",
      "Prolongation flexible selon vos besoins",
    ],
    cta: { label: "Explorer les biens & services", to: "/catalogue?tab=biens-services" },
  },
  {
    id: "gestion-mandat",
    image: "gestion-mandat.webp",
    icon: ShieldCheck,
    titre: "Gestion locative pour propriétaires",
    accroche: "Confiez votre bien, gardez la tranquillité d'esprit.",
    pointsForts: [
      "Mandat clair de gestion, location ou vente",
      "Suivi des loyers et reversements",
      "Un interlocuteur dédié à votre bien",
    ],
    cta: { label: "Proposer un bien", to: "/proposer-un-bien" },
  },
  {
    id: "annonces",
    image: "annonces.webp",
    icon: Megaphone,
    titre: "Annonces immobilières",
    accroche: "Toutes les opportunités du marché, au même endroit.",
    pointsForts: ["Annonces vérifiées par l'agence", "Mises à jour régulières"],
    cta: { label: "Voir les annonces", to: "/annonces" },
  },
  {
    id: "demande-personnalisee",
    image: "demande-personnalisee.webp",
    icon: Key,
    titre: "Demande personnalisée",
    accroche: "Dites-nous ce qu'il vous faut, on s'occupe du reste.",
    pointsForts: ["Recherche sur mesure (budget, secteur, type de bien)", "Accompagnement par un agent"],
    cta: { label: "Déposer une demande", to: "/deposer-une-demande" },
  },
  {
    id: "suivi-documentaire",
    image: "suivi-documentaire.webp",
    icon: FileCheck2,
    titre: "Suivi documentaire & transparence",
    accroche: "Une gestion rigoureuse, des documents en règle à chaque étape.",
    pointsForts: [
      "Quittances et attestations générées officiellement",
      "Contrats et décomptes archivés",
    ],
    cta: { label: "Nous contacter", to: "/contact" },
  },
];

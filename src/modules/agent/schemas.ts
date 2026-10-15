import { z } from "zod";
import { PASSWORD_PATTERN, isValidPhone } from "@/utils/validation";

export const courEditSchema = z.object({
  idSecteur: z.coerce.number({ message: "Choisissez un secteur" }).int().positive("Choisissez un secteur"),
  referenceCour: z.string().min(1, "La référence est requise"),
  lotCour: z.string().optional(),
  numeroPorte: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
});
export type CourEditFormValues = z.infer<typeof courEditSchema>;
export type CourEditFormInput = z.input<typeof courEditSchema>;

export const courCreateSchema = courEditSchema.extend({
  idProprietaire: z.coerce.number({ message: "Choisissez un propriétaire" }).int().positive("Choisissez un propriétaire"),
});
export type CourCreateFormValues = z.infer<typeof courCreateSchema>;
export type CourCreateFormInput = z.input<typeof courCreateSchema>;

export const maisonSchema = z.object({
  idCour: z.coerce.number({ message: "Choisissez une cour" }).int().positive("Choisissez une cour"),
  typeMaison: z.string().optional(),
  nomCommunMaison: z.string().optional(),
  nombrePiece: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  loyer: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  caution: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  avance: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  nombreMoisCaution: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
});
export type MaisonFormValues = z.infer<typeof maisonSchema>;
export type MaisonFormInput = z.input<typeof maisonSchema>;

export const categorieSchema = z.object({
  libelle: z.string().min(1, "Le libellé est requis"),
  description: z.string().optional(),
});
export type CategorieFormValues = z.infer<typeof categorieSchema>;
export type CategorieFormInput = z.input<typeof categorieSchema>;

export const bienServiceEditSchema = z.object({
  idSecteur: z.coerce.number({ message: "Choisissez un secteur" }).int().positive("Choisissez un secteur"),
  idCategorie: z.coerce.number({ message: "Choisissez une catégorie" }).int().positive("Choisissez une catégorie"),
  libelle: z.string().min(1, "Le libellé est requis"),
  description: z.string().optional(),
  prixJournalier: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  prixMensuel: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
});
export type BienServiceEditFormValues = z.infer<typeof bienServiceEditSchema>;
export type BienServiceEditFormInput = z.input<typeof bienServiceEditSchema>;

export const bienServiceCreateSchema = bienServiceEditSchema.extend({
  idGestionnaire: z.coerce.number({ message: "Choisissez un gestionnaire" }).int().positive("Choisissez un gestionnaire"),
});
export type BienServiceCreateFormValues = z.infer<typeof bienServiceCreateSchema>;
export type BienServiceCreateFormInput = z.input<typeof bienServiceCreateSchema>;

export const mandatCreateSchema = z
  .object({
    idCour: z.coerce.number({ message: "Choisissez une cour" }).int().positive("Choisissez une cour"),
    typeMandat: z.enum(["GESTION", "LOCATION", "VENTE"], { message: "Choisissez un type" }),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().optional(),
    commission: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
    modeFacturation: z.enum(["MENSUEL", "CUMUL", "COMMISSION"], { message: "Choisissez un mode de facturation" }),
  })
  .refine((d) => !d.dateFin || d.dateFin > d.dateDebut, { message: "La date de fin doit être après la date de début", path: ["dateFin"] });
export type MandatCreateFormValues = z.infer<typeof mandatCreateSchema>;
export type MandatCreateFormInput = z.input<typeof mandatCreateSchema>;

export const mandatEditSchema = z.object({
  typeMandat: z.enum(["GESTION", "LOCATION", "VENTE"], { message: "Choisissez un type" }),
  dateFin: z.string().optional(),
  commission: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  modeFacturation: z.enum(["MENSUEL", "CUMUL", "COMMISSION"], { message: "Choisissez un mode de facturation" }),
  // Mandat ACTIF : un avenant est créé, motif et accord du client sont alors exigés (vérifié dans la page)
  motif: z.string().optional(),
  accordClient: z.boolean().optional(),
});
export type MandatEditFormValues = z.infer<typeof mandatEditSchema>;
export type MandatEditFormInput = z.input<typeof mandatEditSchema>;

export const resilierMandatSchema = z.object({
  motifResiliation: z.string().min(1, "Le motif de résiliation est requis"),
});
export type ResilierMandatFormValues = z.infer<typeof resilierMandatSchema>;
export type ResilierMandatFormInput = z.input<typeof resilierMandatSchema>;

export const convertirReservationSchema = z.object({
  montantLoyer: z.coerce.number({ message: "Le loyer est requis" }).positive("Le loyer doit être positif"),
  typeContrat: z.string().optional(),
  dateSortie: z.string().optional(),
});
export type ConvertirReservationFormValues = z.infer<typeof convertirReservationSchema>;
export type ConvertirReservationFormInput = z.input<typeof convertirReservationSchema>;

export const modifierLocationSchema = z.object({
  montantLoyer: z.coerce.number().positive("Le loyer doit être positif").optional().or(z.literal("").transform(() => undefined)),
  dateSortie: z.string().optional(),
  // Avenant : toute modification d'un contrat actif exige un motif, l'accord du client et une date d'effet valide
  motif: z.string().trim().min(1, "Le motif est obligatoire"),
  accordClient: z.boolean().refine((v) => v, "Confirmez que le client a accepté la modification"),
  dateEffet: z.string().optional(),
});
export type ModifierLocationFormValues = z.infer<typeof modifierLocationSchema>;
export type ModifierLocationFormInput = z.input<typeof modifierLocationSchema>;

export const cloturerLocationSchema = z.object({
  etatDesLieuxSortie: z.string().min(1, "L'état des lieux de sortie est requis"),
  dateSortie: z.string().optional(),
  montantFrais: z.coerce.number({ message: "Le montant est requis" }).min(0, "Le montant ne peut pas être négatif"),
});
export type CloturerLocationFormValues = z.infer<typeof cloturerLocationSchema>;
export type CloturerLocationFormInput = z.input<typeof cloturerLocationSchema>;

export const reglerDecompteSchema = z.object({
  modePaiement: z.string().min(1, "Le mode de paiement est requis"),
  reference: z.string().optional(),
});
export type ReglerDecompteFormValues = z.infer<typeof reglerDecompteSchema>;
export type ReglerDecompteFormInput = z.input<typeof reglerDecompteSchema>;

export const encaisserPaiementSchema = z.object({
  montantPaiement: z.coerce.number({ message: "Le montant est requis" }).positive("Le montant doit être positif"),
  modePaiement: z.string().min(1, "Le mode de paiement est requis"),
  referencePaiement: z.string().optional(),
});
export type EncaisserPaiementFormValues = z.infer<typeof encaisserPaiementSchema>;
export type EncaisserPaiementFormInput = z.input<typeof encaisserPaiementSchema>;

export const calculerReversementSchema = z.object({
  periode: z.string().min(1, "La période est requise"),
});
export type CalculerReversementFormValues = z.infer<typeof calculerReversementSchema>;
export type CalculerReversementFormInput = z.input<typeof calculerReversementSchema>;

export const confirmerVirementSchema = z.object({
  modeVersement: z.string().min(1, "Le mode de versement est requis"),
  reference: z.string().optional(),
});
export type ConfirmerVirementFormValues = z.infer<typeof confirmerVirementSchema>;
export type ConfirmerVirementFormInput = z.input<typeof confirmerVirementSchema>;

export const annonceSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  typeAnnonce: z.string().optional(),
  dateExpiration: z.string().min(1, "La date d'expiration est requise"),
  prix: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  localisation: z.string().optional(),
});
export type AnnonceFormValues = z.infer<typeof annonceSchema>;
export type AnnonceFormInput = z.input<typeof annonceSchema>;

export const temoignageAdminCreateSchema = z.object({
  nomAuteur: z.string().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  role: z.enum(["PROPRIETAIRE", "LOCATAIRE", "AGENCE", "AUTRE"], { message: "Choisissez un rôle" }),
  texte: z.string().min(10, "10 caractères minimum").max(1000, "1000 caractères maximum"),
  note: z.coerce.number().int().min(1).max(5).optional().or(z.literal("").transform(() => undefined)),
  date: z.string().optional(),
});
export type TemoignageAdminCreateFormValues = z.infer<typeof temoignageAdminCreateSchema>;
export type TemoignageAdminCreateFormInput = z.input<typeof temoignageAdminCreateSchema>;

export const creerCompteProprietaireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  telephone: z.string().min(1, "Le téléphone est requis").refine(isValidPhone, "Numéro de téléphone invalide"),
  password: z.string().regex(PASSWORD_PATTERN, "Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial"),
});
export type CreerCompteProprietaireFormValues = z.infer<typeof creerCompteProprietaireSchema>;
export type CreerCompteProprietaireFormInput = z.input<typeof creerCompteProprietaireSchema>;

export const creerUtilisateurSchema = creerCompteProprietaireSchema.extend({
  role: z.enum(["ROLE_BAILLEUR", "ROLE_CLIENT"]),
  sexe: z.enum(["M", "F"], { message: "Le sexe est requis" }),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  telephone1: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhone(v), "Numéro de téléphone invalide")
    .transform((v) => v || undefined),
});
export type CreerUtilisateurFormValues = z.infer<typeof creerUtilisateurSchema>;
export type CreerUtilisateurFormInput = z.input<typeof creerUtilisateurSchema>;

export const reservationPourClientSchema = z.object({
  idClient: z.coerce.number({ message: "Choisissez un client" }).int().positive("Choisissez un client"),
  idMaison: z.coerce.number({ message: "Choisissez une maison" }).int().positive("Choisissez une maison"),
  // datetime-local (YYYY-MM-DDTHH:mm), heure locale : le backend refuse une date passée (@FutureOrPresent)
  dateDebut: z
    .string()
    .min(1, "La date de début est requise")
    .refine((v) => new Date(v).getTime() >= Date.now(), "La date de début ne peut pas être dans le passé"),
});
export type ReservationPourClientFormValues = z.infer<typeof reservationPourClientSchema>;
export type ReservationPourClientFormInput = z.input<typeof reservationPourClientSchema>;

export const locationPourClientSchema = z
  .object({
    idClient: z.coerce.number({ message: "Choisissez un client" }).int().positive("Choisissez un client"),
    idBienService: z.coerce.number({ message: "Choisissez un bien ou un service" }).int().positive("Choisissez un bien ou un service"),
    destination: z.string().optional(),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });
export type LocationPourClientFormValues = z.infer<typeof locationPourClientSchema>;
export type LocationPourClientFormInput = z.input<typeof locationPourClientSchema>;

// Confirmation d'une location : encaissement + ajustement possible des dates négociées au comptoir
export const confirmerLocationSchema = encaisserPaiementSchema
  .extend({
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })
  .refine((d) => d.dateFin > d.dateDebut, {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });
export type ConfirmerLocationFormValues = z.infer<typeof confirmerLocationSchema>;
export type ConfirmerLocationFormInput = z.input<typeof confirmerLocationSchema>;

export const modifierDureeLocationSchema = z
  .object({
    nouvelleDateFin: z.string().min(1, "La nouvelle date de fin est requise"),
    montantComplement: z.coerce.number().min(0, "Le montant ne peut pas être négatif").optional().or(z.literal("").transform(() => undefined)),
    modePaiementComplement: z.string().optional(),
    referencePaiementComplement: z.string().optional(),
  })
  .refine((d) => !d.montantComplement || !!d.modePaiementComplement?.trim(), {
    message: "Le mode de paiement est requis avec un complément",
    path: ["modePaiementComplement"],
  });
export type ModifierDureeLocationFormValues = z.infer<typeof modifierDureeLocationSchema>;
export type ModifierDureeLocationFormInput = z.input<typeof modifierDureeLocationSchema>;

export const rembourserLocationSchema = z.object({
  montant: z.coerce.number({ message: "Le montant est requis" }).positive("Le montant doit être positif"),
  modeRemboursement: z.string().min(1, "Le mode de remboursement est requis"),
  reference: z.string().optional(),
  motif: z.string().optional(),
});
export type RembourserLocationFormValues = z.infer<typeof rembourserLocationSchema>;
export type RembourserLocationFormInput = z.input<typeof rembourserLocationSchema>;

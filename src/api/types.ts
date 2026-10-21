/**
 * Types partagés, retranscrits depuis gestionImmobiliere/docs/api-frontend.md (§16).
 * Complété au fil des phases à mesure que de nouveaux modules sont branchés.
 */

// ─── Rôles ──────────────────────────────────────────────────────────────
// ERole a 9 valeurs en base ; seules ces 4 sont utilisées par la logique
// métier actuelle (@PreAuthorize) — les autres sont réservées, pas de vue
// à construire pour elles.
export type Role = "ROLE_CLIENT" | "ROLE_BAILLEUR" | "ROLE_AGENT" | "ROLE_ADMIN";

export type Sexe = "M" | "F";

// ─── Enveloppes génériques ──────────────────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  code: string;
  timestamp: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  debug_message?: string;
  exception_type?: string;
}

export interface ApiValidationErrorResponse {
  success: false;
  message: string;
  code: "VALIDATION_ERROR";
  timestamp: string;
  errors: Record<string, string>;
}

export type ApiErrorPayload = ApiErrorResponse | ApiValidationErrorResponse;

export interface PagedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** Filtre ville des listes (confort de l'espace agent) : une ville, ou « sans ville répertoriée ». */
export interface VilleFiltreParams {
  idVille?: number;
  sansVille?: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Enums de statut (valeurs exactes du backend) ──────────────────────
export type StatutAnnonce = "ACTIVE" | "EXPIREE" | "SUSPENDUE";
export type StatutContact = "NON_LU" | "LU" | "TRAITE";
export type StatutDemande = "EN_ATTENTE" | "EN_COURS" | "SATISFAITE" | "ANNULEE";
export type StatutOffre = "EN_ATTENTE" | "TRAITEE" | "REFUSEE";

export type StatutBienService = "DISPONIBLE" | "RESERVEE" | "LOUEE" | "EN_MAINTENANCE";
export type StatutLocationBienService = "EN_ATTENTE" | "ACTIF" | "TERMINE" | "ANNULE";
export type StatutMaison = "DISPONIBLE" | "RESERVEE" | "LOUEE" | "EN_MAINTENANCE";

export type StatutDecompteSortie = "EN_ATTENTE" | "REGLE";
export type StatutLocation = "EN_ATTENTE" | "ACTIF" | "TERMINE" | "RESILIE";
export type StatutMandat = "EN_ATTENTE" | "ACTIF" | "RESILIE" | "EXPIRE";
export type TypeMandat = "GESTION" | "LOCATION" | "VENTE";
export type ModeFacturation = "MENSUEL" | "CUMUL" | "COMMISSION";
/** Modes de facturation autorisés par type de mandat (GET /contrats-mandat/modes-facturation). */
export type ModesFacturationParType = Partial<Record<TypeMandat, ModeFacturation[]>>;

export type StatutThumbnail = "EN_COURS" | "PRET" | "ECHEC";

export type StatutEcheance = "EN_ATTENTE" | "PAYE" | "EN_RETARD" | "ANNULE";
export type TypeEcheance = "MANDAT" | "LOCATION";
export type SensPaiement = "ENTREE" | "SORTIE";
export type TypePaiementLocationBienService = "NORMAL" | "PROLONGATION";

export type StatutReservation = "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "CONVERTIE";

export type TypeEntiteMedia = "COUR" | "ANNONCE" | "MAISON" | "BIEN_SERVICE" | "OFFRE";

export type TypeValeurParametre = "ENTIER" | "DECIMAL" | "BOOLEEN" | "TEXTE";

export interface ParametreResponse {
  idParametre: number;
  cle: string;
  valeur: string;
  typeValeur: TypeValeurParametre;
  description: string | null;
}

// ─── Auth (§2) ──────────────────────────────────────────────────────────
export interface AuthenticateRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  nom: string;
  prenom: string;
  sexe?: Sexe;
  email: string;
  password: string;
  dateNaissance: string; // yyyy-MM-dd
  telephone: string;
  telephone1?: string;
  idRole: number;
}

export interface UserInfoResponse {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  roles: string[];
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

// ─── Profil (§3) ────────────────────────────────────────────────────────
export interface ProfileResponse {
  idUser: number;
  email: string;
  nom: string;
  prenom: string;
  sexe: Sexe | null;
  telephone: string | null;
  telephone1: string | null;
  dateNaissance: string;
  role: string;
}

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  telephone1?: string;
  dateNaissance?: string;
}

// ─── Catalogue public : maisons / biens-services (§6) ──────────────────
export interface MaisonResponse {
  idMaison: number;
  typeMaison: string | null;
  nomCommunMaison: string | null;
  nombrePiece: number | null;
  loyer: number | null;
  caution: number | null;
  avance: number | null;
  nombreMoisCaution: number | null;
  description: string | null;
  statut: StatutMaison;
  idCour: number;
  referenceCour: string;
}

export interface BienServiceResponse {
  idBienService: number;
  libelle: string;
  description: string | null;
  prixJournalier: number | null;
  prixMensuel: number | null;
  disponibilite: StatutBienService;
  idSecteur: number;
  nomSecteur: string;
  idCategorie: number;
  libelleCategorie: string;
  idGestionnaire: number;
  nomGestionnaire: string;
}

// ─── Annonces / contacts / demandes / offres (§9) ──────────────────────
export interface AnnonceResponse {
  idAnnonce: number;
  titre: string;
  description: string | null;
  typeAnnonce: string | null;
  datePublication: string;
  dateExpiration: string;
  statut: StatutAnnonce;
  prix: number | null;
  localisation: string | null;
  idVille: number | null;
  nomVille: string | null;
  villeAutre: string | null;
}

export interface CreateContactRequest {
  nomComplet: string;
  email: string;
  telephone?: string;
  sujet?: string;
  message: string;
}

export interface ContactResponse {
  idContact: number;
  nomComplet: string;
  email: string;
  telephone: string | null;
  sujet: string | null;
  message: string;
  dateEnvoi: string;
  statut: StatutContact;
}

export interface CreateDemandeRequest {
  nomComplet: string;
  email?: string;
  telephone?: string;
  typeBien?: string;
  localisationSouhaite?: string;
  budgetMax?: number;
  description?: string;
  idVille?: number;
  villeAutre?: string;
}

export interface DemandeResponse {
  idDemande: number;
  nomComplet: string;
  email: string | null;
  telephone: string | null;
  typeBien: string | null;
  localisationSouhaite: string | null;
  budgetMax: number | null;
  description: string | null;
  dateDemande: string;
  statut: StatutDemande;
  idVille: number | null;
  nomVille: string | null;
  villeAutre: string | null;
}

export interface CreateOffreRequest {
  nomComplet: string;
  email?: string;
  telephone?: string;
  typeOffre?: string;
  titre?: string;
  description?: string;
  adresse?: string;
  idVille?: number;
  villeAutre?: string;
}

export interface OffreResponse {
  idOffre: number;
  nomComplet: string;
  email: string | null;
  telephone: string | null;
  typeOffre: string | null;
  titre: string | null;
  description: string | null;
  adresse: string | null;
  dateOffre: string;
  statut: StatutOffre;
  idVille: number | null;
  nomVille: string | null;
  villeAutre: string | null;
}

/** Réponse à la création publique : `jetonDepotPhotos` n'apparaît qu'ici (valable 1 h) et autorise l'envoi des photos. */
export interface OffreDepotResponse extends OffreResponse {
  jetonDepotPhotos: string;
}

// ─── Statistiques publiques (§15) ───────────────────────────────────────
export interface PublicStatsResponse {
  maisonsDisponibles: number;
  biensDisponibles: number;
  villesCouvertes: number;
  secteursCouverts: number;
  proprietesGerees: number;
  locationsRealisees: number;
}

// ─── Localisation (§5) ──────────────────────────────────────────────────
export interface PaysResponse {
  idPays: number;
  codePays: string;
  nomPays: string;
}

export interface VilleResponse {
  idVille: number;
  codeVille: string;
  nomVille: string;
  idPays: number;
  nomPays: string;
}

export interface SecteurResponse {
  idSecteur: number;
  codeSecteur: string;
  nomSecteur: string;
  idVille: number;
  nomVille: string;
}

// ─── Témoignages (voir docs/api-temoignages.md) ──
export type TemoignageRole = "PROPRIETAIRE" | "LOCATAIRE" | "AGENCE" | "AUTRE";
export type TemoignageStatut = "EN_ATTENTE" | "PUBLIE" | "RETIRE";

export interface Temoignage {
  idTemoignage: number;
  nomAuteur: string;
  role: TemoignageRole;
  texte: string;
  /** Note sur 5, optionnelle (un témoignage n'est pas toujours noté). */
  note?: number;
  /** URL de la photo/avatar ; absente ou nulle → avatar par initiales. */
  photoUrl?: string | null;
  /** Date du témoignage, ISO 8601 (yyyy-MM-dd). */
  date: string;
}

/** Réponse admin/agent : mêmes champs que `Temoignage`, plus le statut de modération. */
export interface TemoignageAdminResponse extends Temoignage {
  statut: TemoignageStatut;
}

export interface CreateTemoignageRequest {
  nomAuteur: string;
  role: Exclude<TemoignageRole, "AGENCE">;
  texte: string;
  note?: number;
  /** Champ piège anti-robot : toujours envoyé, doit rester vide. */
  siteWeb: string;
}

export interface CreateTemoignageAdminRequest {
  nomAuteur: string;
  role: TemoignageRole;
  texte: string;
  note?: number;
  photoUrl?: string;
  date?: string;
}

export interface UpdateStatutTemoignageRequest {
  statut: TemoignageStatut;
}

// ─── Espace client : réservations (§7), locations biens-services (§7),
// contrats de location (§7), échéances/paiements (§8), stats client (§15) ──
export interface ReservationResponse {
  idReservation: number;
  idUser: number;
  nomUser: string;
  emailUser: string | null;
  telephoneUser: string | null;
  idMaison: number;
  nomCommunMaison: string;
  loyerMaison: number | null;
  dateDebut: string;
  /** Marqueur technique d'expiration du blocage (dateDebut + délai système), pas une date de sortie. */
  dateFin: string;
  statut: StatutReservation;
}

export interface CreateReservationRequest {
  idMaison: number;
  /** Agent/admin uniquement : réserve pour le compte de ce client. */
  idClient?: number;
  dateDebut: string;
}

export interface PaiementLocationBienServiceResponse {
  idPaiement: number;
  montant: number;
  modePaiement: string;
  typePaiement: TypePaiementLocationBienService;
  datePaiement: string;
}

export interface LocationBienServiceResponse {
  idLocationBienService: number;
  idClient: number;
  nomClient: string;
  emailClient: string | null;
  telephoneClient: string | null;
  idBienService: number;
  libelleBienService: string;
  destination: string | null;
  dateDebut: string;
  dateFin: string;
  duree: number;
  prixJournalier: number | null;
  montantTotal: number;
  statut: StatutLocationBienService;
  historiquePaiements: PaiementLocationBienServiceResponse[];
  totalEncaisse: number;
  totalRembourse: number;
  /** montantTotal - totalEncaisse + totalRembourse : négatif = trop-perçu à rembourser. */
  solde: number;
}

export interface ModifierDureeLocationRequest {
  /** ISO LocalDateTime (yyyy-MM-ddTHH:mm:ss). */
  nouvelleDateFin: string;
  montantComplement?: number;
  modePaiementComplement?: string;
  referencePaiementComplement?: string;
}

export interface ModifierDureeLocationResponse {
  location: LocationBienServiceResponse;
  totalEncaisse: number;
  totalRembourse: number;
  solde: number;
}

export interface CreerRemboursementRequest {
  montant: number;
  modeRemboursement: string;
  reference?: string;
  motif?: string;
}

export interface CreateLocationBienServiceRequest {
  idBienService: number;
  /** Agent/admin uniquement : loue pour le compte de ce client. */
  idClient?: number;
  destination?: string;
  /** ISO LocalDateTime (yyyy-MM-ddTHH:mm:ss). */
  dateDebut: string;
  dateFin: string;
}

export interface ConfirmerLocationRequest {
  montantPaiement: number;
  modePaiement: string;
  referencePaiement?: string;
  /** Ajustement des dates négociées au comptoir (ISO LocalDateTime). */
  dateDebut?: string;
  dateFin?: string;
}

export interface RemboursementResponse {
  idRemboursement: number;
  montant: number;
  modeRemboursement: string;
  reference: string | null;
  motif: string | null;
  dateRemboursement: string;
}

export interface ContratLocationResponse {
  idContratLocation: number;
  idLocataire: number;
  nomLocataire: string;
  idMaison: number;
  nomCommunMaison: string;
  referenceCour: string;
  dateEntree: string;
  dateSortie: string | null;
  montantLoyer: number;
  statut: StatutLocation;
  /** Renseignés uniquement par la réponse d'une modification qui a créé un avenant. */
  idAvenant?: number;
  numeroAvenant?: number;
}

export interface EcheanceResponse {
  idEcheance: number;
  type: TypeEcheance;
  entiteId: number;
  dateEcheance: string;
  moisLibelle: string | null;
  montantDu: number;
  montantPaye: number;
  penalite: number | null;
  commissionDeduite: number | null;
  statut: StatutEcheance;
  /** Libellés renvoyés par la liste agent : maison et locataire (LOCATION). */
  nomCommunMaison?: string | null;
  nomLocataire?: string | null;
  /** Cour, propriétaire et commission du mandat (MANDAT). */
  referenceCour?: string | null;
  nomProprietaire?: string | null;
  commissionMandat?: number | null;
  /** Mode de facturation du mandat (MANDAT). */
  modeFacturation?: ModeFacturation | null;
}

export interface EcheanceMandatResponse {
  idEcheance: number;
  idMandat: number;
  referenceCour?: string | null;
  periodeMois: string;
  montantLoyersDus: number | null;
  commissionDeduite: number | null;
  montantNetAReverser: number | null;
  statut: StatutEcheance;
}

export interface ConfirmerVirementRequest {
  modeVersement: string;
  reference?: string;
}

export interface PaiementResponse {
  idPaiement: number;
  datePaiement: string;
  montantPaiement: number;
  sens: SensPaiement;
  modePaiement: string;
  referencePaiement: string | null;
  idEcheancesCouvertes: number[];
}

export interface CreatePaiementRequest {
  montantPaiement: number;
  modePaiement: string;
  referencePaiement?: string;
  datePaiement?: string;
  idEcheances: number[];
}

export interface ClientLocationDTO {
  idLocation: number;
  libelleBien: string;
  dateDebut: string;
  dateFin: string;
  montantTotal: number;
  totalEncaisse: number;
  solde: number;
  statut: StatutLocationBienService;
}

export interface ClientEcheanceDTO {
  idEcheance: number;
  moisLibelle: string | null;
  dateEcheance: string;
  montantDu: number;
  montantPaye: number;
  statut: StatutEcheance;
}

export interface ClientRemboursementDTO {
  idRemboursement: number;
  montant: number;
  motif: string | null;
  dateRemboursement: string;
}

// ─── Espace bailleur (cours, mandat, stats bailleur) ───────────────────
export interface CourResponse {
  idCour: number;
  referenceCour: string;
  lotCour: string | null;
  numeroPorte: number | null;
  description: string | null;
  idSecteur: number;
  nomSecteur: string;
  idProprietaire: number;
  nomProprietaire: string;
}

export interface ContratMandatResponse {
  idMandat: number;
  idCour: number;
  referenceCour: string;
  nomProprietaire: string;
  idAgent: number;
  nomAgent: string;
  dateDebut: string;
  dateFin: string | null;
  typeMandat: TypeMandat;
  commission: number | null;
  modeFacturation: ModeFacturation | null;
  statut: StatutMandat;
  motifResiliation: string | null;
  /** Renseignés uniquement par la réponse d'une modification qui a créé un avenant. */
  idAvenant?: number;
  numeroAvenant?: number;
}

export interface BailleurPatrimoineDTO {
  nbCours: number;
  nbMaisons: number;
  maisonsParStatut: Record<string, number>;
  tauxOccupation: number | null;
}

export interface BailleurRevenuDTO {
  periodeMois: string;
  montantDu: number | null;
  montantRecu: number | null;
  statut: string;
}

// ─── Espace agent : gestion cours/maisons/catégories/biens-services ────
export interface CreateCourRequest {
  idSecteur: number;
  idProprietaire: number;
  referenceCour: string;
  lotCour?: string;
  numeroPorte?: number;
}

export interface UpdateCourRequest {
  idSecteur?: number;
  referenceCour?: string;
  lotCour?: string;
  numeroPorte?: number;
}

export interface CreateMaisonRequest {
  idCour: number;
  typeMaison?: string;
  nomCommunMaison?: string;
  nombrePiece?: number;
  loyer?: number;
  caution?: number;
  avance?: number;
  nombreMoisCaution?: number;
}

export interface UpdateMaisonRequest {
  typeMaison?: string;
  nomCommunMaison?: string;
  nombrePiece?: number;
  loyer?: number;
  caution?: number;
  avance?: number;
  nombreMoisCaution?: number;
}

export interface UpdateStatutMaisonRequest {
  statut: StatutMaison;
}

/** Transitions de statut autorisées (RG3, appliquées côté serveur) — sert à ne proposer que les choix valides. */
export const MAISON_STATUT_TRANSITIONS: Record<StatutMaison, StatutMaison[]> = {
  DISPONIBLE: ["EN_MAINTENANCE"],
  RESERVEE: [],
  LOUEE: [],
  EN_MAINTENANCE: ["DISPONIBLE"],
};

export interface CategorieResponse {
  idCategorie: number;
  libelle: string;
  description: string | null;
  nbBiensServices: number;
}

export interface CreateCategorieRequest {
  libelle: string;
  description?: string;
}

export interface UpdateCategorieRequest {
  libelle?: string;
  description?: string;
}

export interface CreateBienServiceRequest {
  idSecteur: number;
  idCategorie: number;
  idGestionnaire: number;
  libelle: string;
  description?: string;
  prixJournalier?: number;
  prixMensuel?: number;
}

export interface UpdateBienServiceRequest {
  idSecteur?: number;
  idCategorie?: number;
  libelle?: string;
  description?: string;
  prixJournalier?: number;
  prixMensuel?: number;
}

export interface UpdateDisponibiliteBienServiceRequest {
  disponibilite: StatutBienService;
}

/** `GET /api/admin/users?role=` — accessible en lecture à ROLE_AGENT et ROLE_ADMIN, utilisé pour peupler les
 * sélecteurs "propriétaire" (cour) / "gestionnaire" (bien-service). Champs retenus parmi ceux renvoyés. */
export interface UserAdminResponse {
  idUser: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  flagActif: boolean;
  supprime: boolean;
}

export interface CreateUserByAdminRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  sexe?: Sexe;
  telephone?: string;
  telephone1?: string;
  dateNaissance?: string;
  role: Role;
}

// ─── Espace agent : contrats de mandat, réservations, contrats de location ──

export interface CreateContratMandatRequest {
  idCour: number;
  idAgent: number;
  dateDebut: string;
  dateFin?: string;
  typeMandat: TypeMandat;
  commission?: number;
  modeFacturation: ModeFacturation;
}

export interface ResilierMandatRequest {
  motifResiliation: string;
}

export interface ConvertirReservationParams {
  montantLoyer: number;
  typeContrat?: string;
  dateSortie?: string;
}

export interface TerminerLocationRequest {
  etatDesLieuxSortie: string;
  dateSortie?: string;
  fraisReparation: number;
}

export interface ResilierLocationRequest {
  etatDesLieuxSortie: string;
  dateSortie?: string;
  coutReparation: number;
}

/** Modifie un mandat EN_ATTENTE/ACTIF sans le résilier (409 sinon). Tous les champs optionnels (merge partiel). */
export interface UpdateContratMandatRequest {
  dateFin?: string;
  commission?: number;
  modeFacturation?: ModeFacturation;
  typeMandat?: TypeMandat;
  /** Mandat ACTIF : motif et accord du client obligatoires (un avenant est créé). Mandat EN_ATTENTE : ignorés. */
  motif?: string;
  accordClient?: boolean;
  /** yyyy-MM-dd ; pour un mandat, uniquement aujourd'hui (la modification s'applique dès l'enregistrement). */
  dateEffet?: string;
}

/**
 * Prolonge/réduit un bail ACTIF (dateSortie) et/ou corrige le loyer, sans clôturer le contrat (409 si non ACTIF).
 * Crée un avenant : motif et accord du client obligatoires, date d'effet (yyyy-MM-dd) aujourd'hui par défaut, jamais dans le passé.
 */
export interface UpdateContratLocationRequest {
  dateSortie?: string;
  montantLoyer?: number;
  motif: string;
  accordClient: boolean;
  dateEffet?: string;
}

export type ChampAvenant = "montantLoyer" | "dateSortie" | "dateFin" | "commission" | "modeFacturation" | "typeMandat";

/** Avenant à un contrat de location ou à un mandat (`GET /contrats-location|mandat/{id}/avenants`). */
export interface AvenantResponse {
  idAvenant: number;
  typeContrat: "LOCATION" | "MANDAT";
  idContrat: number;
  numeroOrdre: number;
  dateEffet: string;
  motif: string;
  dateCreation: string;
  lignes: { champ: ChampAvenant; ancienneValeur: string | null; nouvelleValeur: string | null }[];
}

export interface DecompteSortieResponse {
  idDecompte: number;
  idContratLocation: number;
  dateSortie: string;
  montantAvanceReference: number;
  montantCautionReference: number;
  montantArrieres: number;
  coutReparation: number;
  montantDeduitAvance: number;
  montantDeduitCaution: number;
  montantManquant: number;
  montantARembourser: number;
  statut: StatutDecompteSortie;
}

export interface ReglerDecompteSortieRequest {
  modePaiement: string;
  reference?: string;
}

// ─── Espace agent : annonces, contacts, demandes, offres ───────────────
export interface CreateAnnonceRequest {
  titre: string;
  description?: string;
  typeAnnonce?: string;
  dateExpiration: string;
  prix?: number;
  localisation?: string;
  idVille?: number;
  villeAutre?: string;
}

export interface UpdateAnnonceRequest {
  titre?: string;
  description?: string;
  typeAnnonce?: string;
  dateExpiration?: string;
  prix?: number;
  localisation?: string;
  idVille?: number;
  villeAutre?: string;
}

export interface UpdateStatutAnnonceRequest {
  statut: StatutAnnonce;
}

export interface UpdateStatutContactRequest {
  statut: StatutContact;
}

export interface UpdateStatutDemandeRequest {
  statut: StatutDemande;
}

export interface UpdateStatutOffreRequest {
  statut: StatutOffre;
}

// ─── Stats agent (tableau de bord) ─────────────────────────────────────
export interface DemandeEnAttenteDTO {
  idLocation: number;
  libelleBien: string;
  nomClient: string;
  dateDebut: string;
  dateFin: string;
  montantEstime: number;
  statut: StatutLocationBienService;
}

export interface ReservationEnAttenteDTO {
  idReservation: number;
  nomMaison: string;
  nomClient: string;
  dateDebut: string;
  dateFin: string;
}

// Note : la doc annonçait `BailleurMandatDTO[]` pour /api/stats/agent/mes-mandats, mais le
// backend réel (AgentStatsService.java) renvoie un décompte par statut (ex. {"ACTIF":2}),
// confirmé par test direct le 2026-10-06. On type donc selon la réponse observée.
export type MesMandatsParStatutDTO = Record<string, number>;

export interface EcheanceRetardAgentDTO {
  idEcheance: number;
  type: "LOCATION" | "MANDAT";
  libelleContrat: string;
  montantDu: number;
  dateEcheance: string;
}


// ─── Notifications in-app ───────────────────────────────────────────────
export type NotificationType = "INFO" | "ECHEANCE" | "DEMANDE";

export interface NotificationResponse {
  idNotification: number;
  type: NotificationType;
  titre: string;
  message?: string | null;
  lien?: string | null;
  lue: boolean;
  dateCreation: string;
}


// ─── Statistiques admin ─────────────────────────────────────────────────
/** Flux entrant : loyers dus par les locataires (échéances de type LOCATION). "Échu" = date d'échéance atteinte. */
export interface LoyersStatsDTO {
  echuTotal: number;
  encaisseSurEchu: number;
  resteAEncaisser: number;
  nombreImpayesEchus: number;
  /** En pourcentage (0 à 100). */
  tauxRecouvrement: number;
  aVenir: number;
  /** Déjà payé sur les loyers à venir (réglés d'avance). */
  payeAvance: number;
  /** Impayés échus par ancienneté de l'échéance. */
  anciennete: { jours0a30: number; jours31a60: number; jours61a90: number; plusDe90: number };
}

export interface CategorieFinanceDTO {
  categorie: string;
  encaisse: number;
  rembourse: number;
  net: number;
  nbLocations: number;
}

/** `GET /api/stats/admin/finances?debut=&fin=` : flux d'une période (sans bornes = depuis le début). */
export interface FinancesPeriodeDTO {
  debut: string | null;
  fin: string | null;
  loyersEncaisses: number;
  reversementsEffectues: number;
  commissionsAcquises: number;
  /** Revenus propres de l'agence (pas de bailleur sur les biens et services). */
  biensServices: {
    encaisse: number;
    rembourse: number;
    net: number;
    nbLocations: number;
    parCategorie: CategorieFinanceDTO[];
  };
  /** Loyers dont la date tombe dans la période (déjà échus) : combien est payé, combien reste. */
  loyersPeriode: {
    dusPeriode: number;
    encaissePeriode: number;
    resteAEncaisser: number;
    nombreEcheances: number;
    nombreImpayes: number;
    /** En pourcentage (0 à 100) ; 0 si rien n'est échu. */
    tauxRecouvrement: number;
  };
  /** Reversements dont la date tombe dans la période (déjà échus) : combien est reversé, combien reste. */
  reversementsPeriode: {
    totalPeriode: number;
    effectue: number;
    aReverser: number;
    nombreReversements: number;
    nombreAReverser: number;
    tauxReverse: number;
  };
  /** Loyers encaissés + biens et services nets. */
  volumeEncaisse: number;
  /** Commissions acquises + biens et services nets. */
  revenuAgence: number;
}

/** Flux sortant : reversements aux bailleurs (échéances de type MANDAT) et commissions de l'agence. */
export interface ReversementsStatsDTO {
  effectue: number;
  aReverser: number;
  nombreAReverser: number;
  aVenir: number;
  commissionsAcquises: number;
  commissionsPrevues: number;
  /** Part des reversements payés dont les loyers du mois n'ont pas été encaissés (avance de l'agence). */
  avanceSansLoyer: number;
  nombreAvances: number;
}

/** `GET /api/stats/admin` (AdminStatsDTO). Les maps sont des décomptes par statut ou par rôle. */
export interface AdminStatsDTO {
  totalUtilisateurs: number;
  utilisateursParRole: Record<string, number>;
  inscriptionsCeMois: number;
  connexionsRecentes7j: number;
  totalCours: number;
  maisonsParStatut: Record<string, number>;
  tauxOccupationMaisons: number;
  biensServiceParDisponibilite: Record<string, Record<string, number>>;
  mandatsParStatut: Record<string, number>;
  contratsLocationParStatut: Record<string, number>;
  mandatsExpirantSous30Jours: number;
  loyers: LoyersStatsDTO;
  reversements: ReversementsStatsDTO;
  locationsBienServiceParStatut: Record<string, number>;
  totalEncaisseBienService: number;
  totalRembourseBienService: number;
  annoncesParStatut: Record<string, number>;
  demandesParStatut: Record<string, number>;
  offresNonTraitees: number;
  contactsNonLus: number;
}

export interface VilleStatsDTO {
  nomVille: string;
  nbMaisons: number;
  nbLocatairesActifs: number;
  /** Valeur de la ville sur la période demandée. */
  loyersEncaisses: number;
  biensServicesNet: number;
  commissionsAcquises: number;
  volumeEncaisse: number;
  revenuAgence: number;
  /** Stock à ce jour, indépendant de la période. */
  impayesEchus: number;
}

export interface BailleurTopDTO {
  idBailleur: number;
  nomComplet: string;
  nbMaisons: number;
  loyersEncaisses: number;
}

export interface LocataireCreanceDTO {
  idLocataire: number;
  nomComplet: string;
  nbEcheancesEnRetard: number;
  montantDu: number;
}

/** Reversements échus et non payés, regroupés par bailleur. */
export interface BailleurCreancierDTO {
  idBailleur: number;
  nomComplet: string;
  nbMois: number;
  montantDu: number;
  plusAncienneEcheance: string;
}

export interface GainAgenceDTO {
  periodeMois: string;
  commissionsAcquises: number;
  commissionsPrevues: number;
  reverseEffectue: number;
  reversePrevu: number;
}

/** Une ligne par mois (`mois` = premier jour du mois). */
export interface EvolutionMensuelleDTO {
  mois: string;
  loyersAttendus: number;
  loyersEncaisses: number;
  reversementsEffectues: number;
  commissionsAcquises: number;
  biensServicesNet: number;
  inscriptions: number;
  nouveauxContrats: number;
}

/** `GET /api/stats/admin/activite?debut=&fin=` : éléments créés ou reçus pendant une période (date de création). */
export interface ActivitePeriodeDTO {
  debut: string | null;
  fin: string | null;
  mandats: number;
  contratsLocation: number;
  locationsBienService: number;
  annonces: number;
  demandes: number;
}

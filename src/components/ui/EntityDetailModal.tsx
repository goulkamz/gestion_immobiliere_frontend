import type { ReactNode } from "react";
import {
  Banknote,
  Building2,
  CalendarClock,
  DoorOpen,
  Home,
  ImageOff,
  Landmark,
  MapPin,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "./Modal";
import { MediaGallery } from "./MediaGallery";
import { DetailFact } from "./DetailFact";
import { StatutBadge } from "./StatutBadge";
import { LoadingSpinner } from "./LoadingSpinner";
import { useMediaItems } from "@/hooks/queries/useMedias";
import {
  useBienServiceQuery,
  useMaisonQuery,
} from "@/hooks/queries/usePublicCatalog";
import { useCoursQuery } from "@/hooks/queries/useCours";
import { formatDate, formatMontant } from "@/utils/format";
import type {
  AnnonceResponse,
  BienServiceResponse,
  CourResponse,
  MaisonResponse,
  TypeEntiteMedia,
} from "@/api/types";

interface Fact {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

interface EntityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entiteType: TypeEntiteMedia;
  /** 0 tant que la fenêtre est fermée : aucune requête de photos n'est lancée. */
  entiteId: number;
  facts: Fact[];
  description?: string | null;
  children?: ReactNode;
}

/** Fiche détail d'une entité (photos + informations), la même présentation que les pages publiques, pour les espaces connectés. */
export function EntityDetailModal({
  isOpen,
  onClose,
  title,
  entiteType,
  entiteId,
  facts,
  description,
  children,
}: EntityDetailModalProps) {
  const { items, isLoading } = useMediaItems(entiteType, isOpen ? entiteId : 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {isLoading ? (
          <div className="aspect-video w-full animate-pulse rounded-xl bg-slate-200" />
        ) : items.length > 0 ? (
          <MediaGallery items={items} alt={title} />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm text-slate-500">
            <ImageOff size={28} aria-hidden="true" />
            Aucune photo pour le moment
          </div>
        )}
        {description && (
          <p className="whitespace-pre-line text-sm text-slate-700">
            {description}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facts.map((f) => (
            <DetailFact
              key={f.label}
              icon={f.icon}
              label={f.label}
              value={f.value}
            />
          ))}
        </dl>
        {children}
      </div>
    </Modal>
  );
}

function maisonFacts(m: MaisonResponse): Fact[] {
  return [
    { icon: Home, label: "Type", value: m.typeMaison ?? "-" },
    { icon: DoorOpen, label: "Pièces", value: m.nombrePiece ?? "-" },
    { icon: Banknote, label: "Loyer", value: formatMontant(m.loyer) },
    { icon: Wallet, label: "Caution", value: formatMontant(m.caution) },
    {
      icon: Banknote,
      label: "Avance",
      value: m.avance !== null ? formatMontant(m.avance) : "-",
    },
    {
      icon: Landmark,
      label: "Mois de caution requis",
      value: m.nombreMoisCaution ?? "-",
    },
    { icon: Building2, label: "Cour", value: m.referenceCour },
    { icon: Tag, label: "Statut", value: <StatutBadge statut={m.statut} /> },
  ];
}

/** Détail d'une maison à partir de son id (chargée à l'ouverture) : réservations, contrats, patrimoine, etc. */
export function MaisonDetailModal({
  idMaison,
  onClose,
}: {
  idMaison: number | null;
  onClose: () => void;
}) {
  const { data: maison, isLoading } = useMaisonQuery(idMaison ?? 0);
  const open = idMaison !== null;
  if (open && (isLoading || !maison)) {
    return (
      <Modal isOpen onClose={onClose} title="Détail de la maison">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }
  return (
    <EntityDetailModal
      isOpen={open}
      onClose={onClose}
      title={
        maison?.nomCommunMaison ??
        (maison ? `Maison #${maison.idMaison}` : "Détail de la maison")
      }
      entiteType="MAISON"
      entiteId={idMaison ?? 0}
      description={maison?.description}
      facts={maison ? maisonFacts(maison) : []}
    />
  );
}

/** Détail d'une maison déjà chargée (listes agent/bailleur). */
export function MaisonDetailModalFromData({
  maison,
  onClose,
}: {
  maison: MaisonResponse | null;
  onClose: () => void;
}) {
  return (
    <EntityDetailModal
      isOpen={maison !== null}
      onClose={onClose}
      title={
        maison
          ? (maison.nomCommunMaison ?? `Maison #${maison.idMaison}`)
          : "Détail de la maison"
      }
      entiteType="MAISON"
      entiteId={maison?.idMaison ?? 0}
      description={maison?.description}
      facts={maison ? maisonFacts(maison) : []}
    />
  );
}

function bienServiceFacts(b: BienServiceResponse): Fact[] {
  return [
    { icon: Tag, label: "Catégorie", value: b.libelleCategorie },
    { icon: MapPin, label: "Secteur", value: b.nomSecteur },
    {
      icon: Banknote,
      label: "Prix journalier",
      value: b.prixJournalier ? formatMontant(b.prixJournalier) : "-",
    },
    {
      icon: Wallet,
      label: "Prix mensuel",
      value: b.prixMensuel ? formatMontant(b.prixMensuel) : "-",
    },
    { icon: User, label: "Gestionnaire", value: b.nomGestionnaire },
    {
      icon: Tag,
      label: "Disponibilité",
      value: <StatutBadge statut={b.disponibilite} />,
    },
  ];
}

/** Détail d'un bien/service à partir de son id (chargé à l'ouverture) : locations du client. */
export function BienServiceDetailModal({
  idBienService,
  onClose,
}: {
  idBienService: number | null;
  onClose: () => void;
}) {
  const { data: bien, isLoading } = useBienServiceQuery(idBienService ?? 0);
  const open = idBienService !== null;
  if (open && (isLoading || !bien)) {
    return (
      <Modal isOpen onClose={onClose} title="Détail du bien/service">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }
  return (
    <EntityDetailModal
      isOpen={open}
      onClose={onClose}
      title={bien?.libelle ?? "Détail du bien/service"}
      entiteType="BIEN_SERVICE"
      entiteId={idBienService ?? 0}
      description={bien?.description}
      facts={bien ? bienServiceFacts(bien) : []}
    />
  );
}

/** Détail d'un bien/service déjà chargé (liste agent). */
export function BienServiceDetailModalFromData({
  bien,
  onClose,
}: {
  bien: BienServiceResponse | null;
  onClose: () => void;
}) {
  return (
    <EntityDetailModal
      isOpen={bien !== null}
      onClose={onClose}
      title={bien?.libelle ?? "Détail du bien/service"}
      entiteType="BIEN_SERVICE"
      entiteId={bien?.idBienService ?? 0}
      description={bien?.description}
      facts={bien ? bienServiceFacts(bien) : []}
    />
  );
}

export function CourDetailModal({
  cour,
  onClose,
}: {
  cour: CourResponse | null;
  onClose: () => void;
}) {
  return (
    <EntityDetailModal
      isOpen={cour !== null}
      onClose={onClose}
      title={cour ? `Cour ${cour.referenceCour}` : "Détail de la cour"}
      entiteType="COUR"
      entiteId={cour?.idCour ?? 0}
      description={cour?.description}
      facts={
        cour
          ? [
              {
                icon: Building2,
                label: "Référence",
                value: cour.referenceCour,
              },
              { icon: Tag, label: "Lot", value: cour.lotCour ?? "-" },
              {
                icon: DoorOpen,
                label: "Numéro de porte",
                value: cour.numeroPorte ?? "-",
              },
              { icon: MapPin, label: "Secteur", value: cour.nomSecteur },
              {
                icon: User,
                label: "Propriétaire",
                value: cour.nomProprietaire,
              },
            ]
          : []
      }
    />
  );
}

export function AnnonceDetailModal({
  annonce,
  onClose,
}: {
  annonce: AnnonceResponse | null;
  onClose: () => void;
}) {
  return (
    <EntityDetailModal
      isOpen={annonce !== null}
      onClose={onClose}
      title={annonce?.titre ?? "Détail de l'annonce"}
      entiteType="ANNONCE"
      entiteId={annonce?.idAnnonce ?? 0}
      description={annonce?.description}
      facts={
        annonce
          ? [
              { icon: Tag, label: "Type", value: annonce.typeAnnonce ?? "-" },
              {
                icon: Banknote,
                label: "Prix",
                value:
                  annonce.prix !== null ? formatMontant(annonce.prix) : "-",
              },
              {
                icon: MapPin,
                label: "Localisation",
                value: annonce.localisation ?? "-",
              },
              {
                icon: Tag,
                label: "Statut",
                value: <StatutBadge statut={annonce.statut} />,
              },
              {
                icon: CalendarClock,
                label: "Publiée le",
                value: formatDate(annonce.datePublication),
              },
              {
                icon: CalendarClock,
                label: "Expire le",
                value: formatDate(annonce.dateExpiration),
              },
            ]
          : []
      }
    />
  );
}

/** Détail d'une cour à partir de son id, retrouvée dans la liste des cours accessibles à l'utilisateur (mandats). */
export function CourDetailModalById({ idCour, onClose }: { idCour: number | null; onClose: () => void }) {
  const { data } = useCoursQuery({ size: 100 });
  const cour = idCour !== null ? ((data?.content ?? []).find((c) => c.idCour === idCour) ?? null) : null;
  return <CourDetailModal cour={cour} onClose={onClose} />;
}

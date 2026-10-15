import type { AxiosResponse } from "axios";
import type { ReactNode } from "react";
import { FilePen } from "lucide-react";
import { documentsApi } from "@/api/documents";
import type { AvenantResponse, ChampAvenant, ModeFacturation } from "@/api/types";
import { formatDate, formatMontant } from "@/utils/format";
import { MODE_FACTURATION_LABELS } from "@/utils/mandat";

const LIBELLES_CHAMPS: Record<ChampAvenant, string> = {
  montantLoyer: "Loyer mensuel",
  dateSortie: "Date de sortie",
  dateFin: "Date de fin",
  commission: "Commission",
  modeFacturation: "Mode de facturation",
  typeMandat: "Type de mandat",
};

const LIBELLES_TYPES_MANDAT: Record<string, string> = { GESTION: "Gestion", LOCATION: "Location", VENTE: "Vente" };

function formaterValeur(champ: ChampAvenant, valeur: string | null): string {
  if (valeur === null || valeur === "") return champ === "dateSortie" || champ === "dateFin" ? "Durée indéterminée" : "-";
  switch (champ) {
    case "montantLoyer":
      return formatMontant(Number(valeur));
    case "commission":
      return `${Number(valeur)} %`;
    case "dateSortie":
    case "dateFin":
      return formatDate(valeur);
    case "modeFacturation":
      return MODE_FACTURATION_LABELS[valeur as ModeFacturation] ?? valeur;
    case "typeMandat":
      return LIBELLES_TYPES_MANDAT[valeur] ?? valeur;
  }
}

/** Résumé d'un avenant, ex. « Loyer mensuel : 50 000 F CFA → 55 000 F CFA ». */
export function resumeAvenant(avenant: AvenantResponse): string {
  return avenant.lignes
    .map((l) => `${LIBELLES_CHAMPS[l.champ] ?? l.champ} : ${formaterValeur(l.champ, l.ancienneValeur)} → ${formaterValeur(l.champ, l.nouvelleValeur)}`)
    .join(" ; ");
}

export interface DocumentAvenant {
  key: string;
  label: string;
  icon: ReactNode;
  fetcher: () => Promise<AxiosResponse<Blob>>;
  filename: string;
}

/** Les avenants d'un contrat sous forme de documents à prévisualiser ou télécharger (même forme que les autres pages). */
export function documentsAvenants(avenants: AvenantResponse[] | undefined): DocumentAvenant[] {
  return (avenants ?? []).map((a) => ({
    key: `avenant-${a.idAvenant}`,
    label: `Avenant n°${a.numeroOrdre} du ${formatDate(a.dateEffet)} (${resumeAvenant(a)})`,
    icon: <FilePen size={16} className="shrink-0 text-primary-600" aria-hidden="true" />,
    fetcher: () => documentsApi.avenant(a.idAvenant),
    filename: `avenant-${a.numeroOrdre}-${a.typeContrat === "LOCATION" ? "location" : "mandat"}-${a.idContrat}.pdf`,
  }));
}

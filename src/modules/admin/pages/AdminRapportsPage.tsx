import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Eye, FileText } from "lucide-react";
import { Badge, Button, DocumentPreviewModal, EmptyState, LoadingSpinner, PageHeader } from "@/components/ui";
import { documentsApi } from "@/api/documents";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";

interface MoisRapport {
  /** Premier jour du mois, AAAA-MM-01. */
  periode: string;
  libelle: string;
  provisoire: boolean;
}

/** Le mois en cours puis les précédents jusqu'au premier mois d'activité (AAAA-MM-JJ), du plus récent au plus ancien. */
function moisDepuis(premierMois: string): MoisRapport[] {
  const maintenant = new Date();
  const [annee = maintenant.getFullYear(), mois = maintenant.getMonth() + 1] = premierMois.split("-").map(Number);
  const nbMois = (maintenant.getFullYear() - annee) * 12 + maintenant.getMonth() + 1 - mois + 1;
  return Array.from({ length: Math.max(nbMois, 1) }, (_, i) => {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const libelle = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return {
      periode: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
      libelle: libelle.charAt(0).toUpperCase() + libelle.slice(1),
      provisoire: i === 0,
    };
  });
}

export function AdminRapportsPage() {
  const { openPreview, download, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();
  // Un rapport de mois passé est figé à sa première génération : on ne propose que les mois où il y a eu de l'activité
  const premierMoisQuery = useQuery({ queryKey: ["rapports", "premier-mois"], queryFn: documentsApi.premierMoisRapport, staleTime: 60 * 60 * 1000 });
  const mois = premierMoisQuery.data ? moisDepuis(premierMoisQuery.data) : [];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Rapports mensuels"
        description="Loyers, commissions, reversements et situation de l'agence, mois par mois, au format PDF."
      />

      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Le rapport du mois en cours est provisoire : il est recalculé à chaque ouverture. Celui d&apos;un mois terminé est définitif,
        généré une seule fois puis conservé tel quel (le rapport du mois écoulé est généré automatiquement le 1er de chaque mois).
        La liste démarre au premier mois d&apos;activité.
      </p>

      {premierMoisQuery.isError ? (
        <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les rapports" description="Une erreur est survenue côté serveur. Réessayez dans quelques instants." />
      ) : premierMoisQuery.isLoading ? (
        <LoadingSpinner />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm">
          {mois.map((m) => {
            const fichier = `rapport-mensuel-${m.periode.slice(0, 7)}${m.provisoire ? "-provisoire" : ""}.pdf`;
            const fetcher = () => documentsApi.rapportMensuel(m.periode);
            const cle = `rapport-${m.periode}`;
            return (
              <li key={m.periode} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="shrink-0 text-primary-600" aria-hidden="true" />
                  <span className="font-medium text-slate-800">{m.libelle}</span>
                  <Badge variant={m.provisoire ? "warning" : "success"}>{m.provisoire ? "Provisoire" : "Définitif"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<Eye size={15} />} loading={isPending(cle)} onClick={() => openPreview(cle, fetcher, `Rapport mensuel - ${m.libelle}`, fichier)}>
                    Aperçu
                  </Button>
                  <Button variant="outline" size="sm" icon={<Download size={15} />} disabled={isPending(cle)} onClick={() => download(cle, fetcher, fichier)}>
                    Télécharger
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DocumentPreviewModal isOpen={preview !== null} onClose={closePreview} title={preview?.title ?? ""} blob={preview?.blob ?? null} onDownload={downloadPreview} />
    </div>
  );
}

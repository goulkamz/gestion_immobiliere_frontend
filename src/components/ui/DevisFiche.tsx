import type { ReactNode } from "react";
import { FileText, MessageSquareWarning, PhoneCall } from "lucide-react";
import { devisApi } from "@/api/devis";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { CATEGORIE_DEPENSE_LABELS, etalementLabel } from "@/utils/depense";
import { DEVIS_STATUT_LABELS } from "@/utils/devis";
import { formatDate, formatDateTime, formatMontant } from "@/utils/format";
import type { DevisResponse } from "@/api/types";
import { Button } from "./Button";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { StatutBadge } from "./StatutBadge";

interface DevisFicheProps {
  devis: DevisResponse;
  /** Le bailleur lit son propre devis : pas de ligne « Bailleur », formulations à la deuxième personne. */
  vue: "agent" | "bailleur";
}

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

/** Contenu d'un devis de travaux (dans une modale) : ce qui est proposé, puis la dernière réponse du bailleur. */
export function DevisFiche({ devis, vue }: DevisFicheProps) {
  const bailleur = vue === "bailleur";
  const depassePlafond = devis.plafondDepenseSansAccord !== null && devis.montant > devis.plafondDepenseSansAccord;
  const { openPreview, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();
  const cleDocument = `devis-${devis.idDevis}`;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <Ligne label="Cour">
          {devis.referenceCour}
          {devis.nomMaison ? ` - ${devis.nomMaison}` : ""}
        </Ligne>
        {!bailleur && <Ligne label="Bailleur">{devis.nomProprietaire}</Ligne>}
        <div>
          <dt className="text-slate-500">Statut</dt>
          <dd>
            <StatutBadge statut={devis.statut} label={DEVIS_STATUT_LABELS[devis.statut]} />
          </dd>
        </div>
        <Ligne label="Catégorie">{CATEGORIE_DEPENSE_LABELS[devis.categorie]}</Ligne>
        <Ligne label="Prestataire">{devis.prestataire || "-"}</Ligne>
        <Ligne label="Soumis le">{formatDate(devis.dateSoumission)}</Ligne>
        {devis.statut === "EN_ATTENTE" && devis.dateLimiteReponse && (
          <Ligne label={bailleur ? "Votre réponse avant le" : "Réponse attendue avant le"}>{formatDate(devis.dateLimiteReponse)}</Ligne>
        )}
        <Ligne label="Montant du devis">{formatMontant(devis.montant)}</Ligne>
        <Ligne label="Retenue proposée">{etalementLabel(devis)}</Ligne>
        {devis.nombreSoumissions > 1 && <Ligne label="Version">{`${devis.nombreSoumissions}e soumission`}</Ligne>}
      </dl>

      {devis.description && <p className="whitespace-pre-line text-sm text-slate-600">{devis.description}</p>}

      {devis.pieceJointe && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <FileText size={16} className="shrink-0 text-primary-600" aria-hidden="true" />
          <span className="flex-1">{bailleur ? "L'agence a joint le devis de l'artisan." : "Le devis de l'artisan (PDF) est joint."}</span>
          <Button
            size="sm"
            variant="secondary"
            loading={isPending(cleDocument)}
            onClick={() => openPreview(cleDocument, () => devisApi.pieceJointe(devis.idDevis), `Devis - ${devis.libelle}`, `devis-${devis.idDevis}.pdf`)}
          >
            Voir le devis PDF
          </Button>
        </div>
      )}

      <p className="text-sm text-slate-600">
        {bailleur
          ? "Si vous acceptez, l'agence fait réaliser les travaux puis retient leur coût sur vos reversements. Le montant retenu ne dépassera jamais celui de ce devis."
          : "Une fois le devis accepté, la dépense s'enregistre depuis cette page, pour un montant au plus égal à celui du devis."}
        {depassePlafond
          ? bailleur
            ? ` Ce montant dépasse le plafond de ${formatMontant(devis.plafondDepenseSansAccord)} fixé dans votre mandat : votre accord est nécessaire.`
            : ` Ce montant dépasse le plafond du mandat (${formatMontant(devis.plafondDepenseSansAccord)}).`
          : ""}
      </p>

      {devis.commentaireBailleur && (devis.statut === "A_RENEGOCIER" || devis.statut === "REJETE") && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
          <MessageSquareWarning size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {devis.statut === "REJETE"
                ? bailleur
                  ? "Vous avez rejeté ce devis"
                  : "Devis rejeté par le bailleur"
                : bailleur
                  ? "Vous avez demandé une renégociation"
                  : "Le bailleur demande une renégociation"}
              {devis.dateReponse ? ` le ${formatDateTime(devis.dateReponse)}` : ""}
            </p>
            <p className="mt-0.5 whitespace-pre-line">{devis.commentaireBailleur}</p>
          </div>
        </div>
      )}

      {devis.accordHorsPlateforme && (devis.statut === "ACCEPTE" || devis.statut === "REALISE") && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
          <PhoneCall size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {bailleur ? "L'agence a enregistré votre accord, donné hors plateforme" : "Accord du bailleur enregistré hors plateforme"}
              {devis.accordDate ? ` le ${formatDate(devis.accordDate)}` : ""}
            </p>
            <p className="mt-0.5 whitespace-pre-line">{devis.accordMotif}</p>
            {bailleur && devis.statut === "ACCEPTE" && (
              <p className="mt-1">Si vous ne reconnaissez pas cet accord, contestez-le : le devis repartira en renégociation. Après l&apos;enregistrement de la dépense, ce ne sera plus possible.</p>
            )}
          </div>
        </div>
      )}

      {(devis.statut === "ACCEPTE" || devis.statut === "REALISE") && devis.dateReponse && !devis.accordHorsPlateforme && (
        <p className="rounded-xl border border-success-600/30 bg-success-50 p-3 text-sm text-success-700">
          {bailleur ? "Vous avez accepté ce devis" : "Devis accepté par le bailleur"} le {formatDateTime(devis.dateReponse)}.
          {devis.statut === "REALISE" ? " La dépense a été enregistrée." : bailleur ? " L'agence peut engager les travaux." : ""}
        </p>
      )}

      <DocumentPreviewModal
        isOpen={preview !== null}
        onClose={closePreview}
        title={preview?.title ?? ""}
        blob={preview?.blob ?? null}
        onDownload={downloadPreview}
      />

      {devis.statut === "EXPIRE" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
          {bailleur
            ? "Ce devis a expiré faute de réponse dans le délai. L'agence peut vous le soumettre à nouveau."
            : "Ce devis a expiré : le bailleur n'a pas répondu dans le délai. Modifiez-le pour le soumettre à nouveau, ou retirez-le."}
        </p>
      )}

      {devis.statut === "ANNULE" && devis.motifAnnulation && (
        <p className="rounded-xl border border-danger-500/40 bg-danger-50 p-3 text-sm text-danger-700">Retiré par l&apos;agence : {devis.motifAnnulation}</p>
      )}
    </div>
  );
}

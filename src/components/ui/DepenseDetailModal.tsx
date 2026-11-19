import { useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Ban, FileText, MessageSquareWarning } from "lucide-react";
import { ApiError } from "@/api/http";
import { documentsApi } from "@/api/documents";
import {
  useAnnulerReglementMutation,
  useContesterDepenseMutation,
  useDepenseQuery,
  useRepondreContestationMutation,
} from "@/hooks/queries/useDepenses";
import { useDocumentDownload } from "@/hooks/queries/useDocumentDownload";
import { CATEGORIE_DEPENSE_LABELS, etalementLabel } from "@/utils/depense";
import { formatDate, formatMontant } from "@/utils/format";
import { moisOccupation } from "@/utils/mandat";
import type { DepenseImputationResponse, DepenseReglementResponse } from "@/api/types";
import { Button } from "./Button";
import { DataTable, type DataTableColumn } from "./DataTable";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { StatutBadge } from "./StatutBadge";
import { Textarea } from "./Textarea";

interface DepenseDetailModalProps {
  /** Dépense à afficher ; null = modale fermée. */
  idDepense: number | null;
  onClose: () => void;
  /** Le bailleur lit sa propre dépense : pas de colonne « Bailleur », formulations à la deuxième personne, pas d'annulation de règlement. */
  vue: "agent" | "bailleur";
}

const RETENUES_COLUMNS: DataTableColumn<DepenseImputationResponse>[] = [
  { key: "echeance", header: "Reversement du", render: (i) => formatDate(i.periodeMois) },
  { key: "occupation", header: "Occupation", render: (i) => moisOccupation(i.periodeMois) },
  { key: "montant", header: "Retenu", align: "right", render: (i) => formatMontant(i.montant) },
  { key: "statut", header: "Reversement", render: (i) => <StatutBadge statut={i.statutReversement} /> },
];

/** Détail d'une dépense à la charge du bailleur, avec ce qui a été retenu reversement par reversement. */
export function DepenseDetailModal({ idDepense, onClose, vue }: DepenseDetailModalProps) {
  const detailQuery = useDepenseQuery(idDepense);
  const detail = detailQuery.data;
  const bailleur = vue === "bailleur";

  const { openPreview, closePreview, downloadPreview, preview, isPending } = useDocumentDownload();
  const annulerReglement = useAnnulerReglementMutation();
  // Règlement dont l'annulation est en cours de saisie (motif obligatoire)
  const [aAnnuler, setAAnnuler] = useState<DepenseReglementResponse | null>(null);
  const [motif, setMotif] = useState("");
  const [erreurMotif, setErreurMotif] = useState<string | null>(null);

  // Contestation du bailleur, ou réponse de l'agence : une seule saisie de motif, deux issues
  const contester = useContesterDepenseMutation();
  const repondre = useRepondreContestationMutation();
  const [saisie, setSaisie] = useState<"contester" | "repondre" | null>(null);
  const [texte, setTexte] = useState("");
  const [erreurTexte, setErreurTexte] = useState<string | null>(null);

  async function onEnvoyerSaisie() {
    if (!saisie || idDepense === null) return;
    if (!texte.trim()) {
      setErreurTexte(saisie === "contester" ? "Expliquez pourquoi vous contestez cette dépense" : "La réponse est requise");
      return;
    }
    try {
      if (saisie === "contester") {
        await contester.mutateAsync({ id: idDepense, motif: texte.trim() });
        toast.success("Contestation transmise à l'agence, qui vous répondra.");
      } else {
        await repondre.mutateAsync({ id: idDepense, motif: texte.trim() });
        toast.success("Réponse envoyée au bailleur.");
      }
      setSaisie(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    }
  }

  async function onAnnulerReglement() {
    if (!aAnnuler || idDepense === null) return;
    if (!motif.trim()) {
      setErreurMotif("Le motif est requis");
      return;
    }
    try {
      await annulerReglement.mutateAsync({ id: idDepense, idReglement: aAnnuler.idReglement, motif: motif.trim() });
      toast.success("Règlement annulé. Le bailleur en est informé.");
      setAAnnuler(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Annulation impossible.");
    }
  }

  const reglementsColumns: DataTableColumn<DepenseReglementResponse>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.dateReglement) },
    { key: "mode", header: "Mode", render: (r) => r.modeReglement || "-" },
    { key: "reference", header: "Référence", render: (r) => r.reference || "-" },
    {
      key: "montant",
      header: "Réglé",
      align: "right",
      render: (r) => (r.annule ? <span className="text-slate-400 line-through">{formatMontant(r.montant)}</span> : formatMontant(r.montant)),
    },
    {
      key: "actions",
      header: "Reçu et correction",
      align: "right",
      render: (r) =>
        r.annule ? (
          <span className="block text-right text-xs text-danger-700">
            Annulé{r.dateAnnulation ? ` le ${formatDate(r.dateAnnulation)}` : ""}
            {r.motifAnnulation ? ` : ${r.motifAnnulation}` : ""}
          </span>
        ) : (
          <span className="inline-flex flex-wrap justify-end gap-1">
            <Button
              size="sm"
              variant="secondary"
              icon={<FileText size={14} />}
              loading={isPending(`reglement-${r.idReglement}`)}
              onClick={() =>
                openPreview(
                  `reglement-${r.idReglement}`,
                  () => documentsApi.recuReglementDepense(r.idReglement),
                  `Reçu de règlement du ${formatDate(r.dateReglement)}`,
                  `recu-reglement-${r.idReglement}.pdf`,
                )
              }
            >
              Reçu
            </Button>
            {!bailleur && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Ban size={14} />}
                onClick={() => {
                  setMotif("");
                  setErreurMotif(null);
                  setAAnnuler(r);
                }}
              >
                Annuler
              </Button>
            )}
          </span>
        ),
    },
  ];

  return (
    <>
      <Modal isOpen={idDepense !== null} onClose={onClose} title={detail ? detail.libelle : "Dépense"} titleTone="indigo" size="lg">
        {detailQuery.isError ? (
          <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger la dépense" description="Réessayez dans quelques instants." />
        ) : !detail ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Cour</dt>
                <dd className="font-semibold text-slate-900">
                  {detail.referenceCour}
                  {detail.nomMaison ? ` - ${detail.nomMaison}` : ""}
                </dd>
              </div>
              {!bailleur && (
                <div>
                  <dt className="text-slate-500">Bailleur</dt>
                  <dd className="font-semibold text-slate-900">{detail.nomProprietaire}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Statut</dt>
                <dd>
                  <StatutBadge statut={detail.statut} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Catégorie</dt>
                <dd className="font-semibold text-slate-900">{CATEGORIE_DEPENSE_LABELS[detail.categorie]}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd className="font-semibold text-slate-900">{formatDate(detail.dateDepense)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Prestataire</dt>
                <dd className="font-semibold text-slate-900">{detail.prestataire || "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Montant</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(detail.montant)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Déjà retenu</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(detail.montantImpute)}</dd>
              </div>
              {detail.montantRegle > 0 && (
                <div>
                  <dt className="text-slate-500">Réglé en direct</dt>
                  <dd className="font-semibold text-slate-900">{formatMontant(detail.montantRegle)}</dd>
                </div>
              )}
              {detail.montantAbandonne > 0 && (
                <div>
                  <dt className="text-slate-500">Abandonné par l&apos;agence</dt>
                  <dd className="font-semibold text-slate-900">{formatMontant(detail.montantAbandonne)}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">{detail.statut === "A_REGLER" ? "Reste dû" : "Reste à retenir"}</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(detail.montantRestant)}</dd>
              </div>
            </dl>
            {detail.mandatEchu && !bailleur && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Le mandat de cette cour est arrivé à terme{detail.dateFinMandat ? ` le ${formatDate(detail.dateFinMandat)}` : ""} mais reste actif.
                  Résiliez-le (le solde est alors retenu d&apos;un coup) ou prolongez-le par avenant depuis la page Mandats.
                </span>
              </p>
            )}
            {detail.statut === "A_REGLER" && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  {bailleur
                    ? "Le mandat de cette cour est résilié : l'étalement s'arrête. Le solde est retenu en totalité sur vos derniers reversements ; ce qui reste est à régler directement à l'agence."
                    : "Mandat résilié : l'étalement s'arrête. Le solde est retenu en totalité sur les derniers reversements à calculer ; enregistrez le règlement direct du bailleur pour le reste."}
                </span>
              </p>
            )}
            {detail.dateRetablissement && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Une créance abandonnée a été rétablie le {formatDate(detail.dateRetablissement)}
                {detail.motifRetablissement ? ` : ${detail.motifRetablissement}` : ""}.
              </p>
            )}
            {detail.dateContestation && (
              <div
                className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                  detail.contestationOuverte ? "border-amber-200 bg-amber-50/70 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <MessageSquareWarning size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    {bailleur ? "Vous avez contesté cette dépense" : "Dépense contestée par le bailleur"} le {formatDate(detail.dateContestation)}
                    {detail.contestationOuverte ? (bailleur ? " : l'agence n'a pas encore répondu" : " : réponse attendue") : ""}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line">{detail.motifContestation}</p>
                  {detail.reponseContestation && (
                    <p className="mt-1 whitespace-pre-line">
                      <span className="font-semibold">Réponse de l&apos;agence{detail.dateReponseContestation ? ` le ${formatDate(detail.dateReponseContestation)}` : ""} :</span>{" "}
                      {detail.reponseContestation}
                    </p>
                  )}
                  {!bailleur && detail.contestationOuverte && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setTexte("");
                        setErreurTexte(null);
                        setSaisie("repondre");
                      }}
                    >
                      Répondre au bailleur
                    </Button>
                  )}
                </div>
              </div>
            )}
            {bailleur &&
              !detail.dateContestation &&
              detail.statut !== "ANNULEE" &&
              !(detail.idDevis !== null && !detail.accordMotif) && (
                <div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<MessageSquareWarning size={14} />}
                    onClick={() => {
                      setTexte("");
                      setErreurTexte(null);
                      setSaisie("contester");
                    }}
                  >
                    Je conteste cette dépense
                  </Button>
                  <p className="mt-1 text-xs text-slate-500">L&apos;agence est alertée et vous répond. Rien n&apos;est annulé automatiquement.</p>
                </div>
              )}
            {detail.montantAbandonne > 0 && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {bailleur
                  ? `L'agence a renoncé à vous réclamer ${formatMontant(detail.montantAbandonne)}`
                  : `Abandon de créance de ${formatMontant(detail.montantAbandonne)}`}
                {detail.dateAbandon ? ` le ${formatDate(detail.dateAbandon)}` : ""}
                {detail.motifAbandon ? ` : ${detail.motifAbandon}` : ""}.
              </p>
            )}
            <p className="text-sm text-slate-600">
              {detail.statut === "A_REGLER" ? "Étalement d'origine" : "Retenue prévue"} : {etalementLabel(detail)}.
              {detail.nombreMoisInitial !== null &&
                ` Rééchelonnée${detail.dateReechelonnement ? ` le ${formatDate(detail.dateReechelonnement)}` : ""} (prévue au départ sur ${detail.nombreMoisInitial} reversement${detail.nombreMoisInitial > 1 ? "s" : ""})${detail.motifReechelonnement ? ` : ${detail.motifReechelonnement}` : ""}.`}
              {detail.statut === "EN_COURS" && detail.moisRestants !== null && detail.montantImpute > 0 &&
                ` Encore ${detail.moisRestants} reversement${detail.moisRestants > 1 ? "s" : ""} prévu${detail.moisRestants > 1 ? "s" : ""}.`}
              {detail.idDevis !== null
                ? detail.accordMotif
                  ? bailleur
                    ? ` Dépense issue d'un devis dont l'agence a enregistré votre accord. ${detail.accordMotif}.`
                    : ` Dépense issue d'un devis dont l'accord a été enregistré par l'agent. ${detail.accordMotif}.`
                  : bailleur
                    ? " Dépense issue d'un devis que vous avez accepté."
                    : " Dépense issue d'un devis accepté par le bailleur."
                : detail.accordBailleur
                  ? bailleur
                    ? ` L'agence indique avoir reçu votre accord pour cette dépense${detail.accordMotif ? ` (${detail.accordMotif})` : ""}.`
                    : ` Accord du bailleur attesté par l'agent${detail.accordMotif ? ` : ${detail.accordMotif}` : ""}.`
                  : ""}
            </p>
            {detail.description && <p className="whitespace-pre-line text-sm text-slate-600">{detail.description}</p>}
            {detail.statut === "ANNULEE" && detail.motifAnnulation && (
              <p className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">Annulée : {detail.motifAnnulation}</p>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {bailleur ? "Retenues sur vos reversements" : "Retenues sur les reversements"}
              </h3>
              <DataTable
                data={detail.imputations ?? []}
                columns={RETENUES_COLUMNS}
                keyExtractor={(i) => i.idImputation}
                emptyMessage={
                  detail.statut === "ANNULEE"
                    ? "Aucune retenue : la dépense a été annulée."
                    : bailleur
                      ? "Aucune retenue pour le moment : elle se fera sur votre prochain reversement calculé."
                      : "Aucune retenue pour le moment : elle se fera au prochain reversement calculé pour ce mandat."
                }
              />
            </div>
            {(detail.reglements ?? []).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {bailleur ? "Vos règlements directs à l'agence" : "Règlements directs du bailleur"}
                </h3>
                <DataTable data={detail.reglements ?? []} columns={reglementsColumns} keyExtractor={(r) => r.idReglement} emptyMessage="Aucun règlement" />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={saisie !== null}
        onClose={() => setSaisie(null)}
        title={saisie === "contester" ? "Contester cette dépense" : "Répondre au bailleur"}
        titleTone="indigo"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {saisie === "contester"
              ? "Indiquez pourquoi vous contestez cette dépense. L'agence est alertée et vous répond ; rien n'est annulé automatiquement. Vous ne pouvez contester une dépense qu'une seule fois."
              : "Votre réponse est envoyée au bailleur et clôt sa contestation. Si la dépense doit être annulée ou modifiée, faites-le avant de répondre."}
          </p>
          <Textarea
            label={saisie === "contester" ? "Motif de la contestation" : "Votre réponse"}
            required
            rows={3}
            value={texte}
            onChange={(e) => {
              setTexte(e.target.value);
              setErreurTexte(null);
            }}
            error={erreurTexte ?? undefined}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setSaisie(null)}>
              Retour
            </Button>
            <Button type="button" className="flex-1" loading={contester.isPending || repondre.isPending} onClick={onEnvoyerSaisie}>
              {saisie === "contester" ? "Envoyer la contestation" : "Envoyer la réponse"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={aAnnuler !== null} onClose={() => setAAnnuler(null)} title="Annuler ce règlement ?" titleTone="indigo">
        {aAnnuler && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Le règlement de <strong>{formatMontant(aAnnuler.montant)}</strong> du {formatDate(aAnnuler.dateReglement)} ne comptera plus : la dette
              correspondante réapparaît et le bailleur en est informé. Le règlement reste visible dans l&apos;historique, marqué comme annulé.
            </p>
            <Textarea
              label="Motif de l'annulation"
              required
              rows={2}
              placeholder="Ex. saisi sur la mauvaise dépense, montant erroné"
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                setErreurMotif(null);
              }}
              error={erreurMotif ?? undefined}
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setAAnnuler(null)}>
                Retour
              </Button>
              <Button type="button" variant="danger" className="flex-1" loading={annulerReglement.isPending} onClick={onAnnulerReglement}>
                Annuler le règlement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DocumentPreviewModal
        isOpen={preview !== null}
        onClose={closePreview}
        title={preview?.title ?? ""}
        blob={preview?.blob ?? null}
        onDownload={downloadPreview}
      />
    </>
  );
}

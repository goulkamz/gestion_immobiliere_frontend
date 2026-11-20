import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Building2, Check, Eye, MessageSquare, ShieldAlert, X } from "lucide-react";
import { Button, CompteursStatut, DataTable, EmptyState, Modal, PageHeader, Pagination, Select, StatutBadge, Textarea } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { DevisFiche } from "@/components/ui/DevisFiche";
import { devisApi } from "@/api/devis";
import { ApiError } from "@/api/http";
import { useCoursQuery } from "@/hooks/queries/useCours";
import {
  useAccepterDevisMutation,
  useContesterAccordMutation,
  useDevisQuery,
  useRejeterDevisMutation,
  useRenegocierDevisMutation,
} from "@/hooks/queries/useDevis";
import { useCompteursStatut } from "@/hooks/useCompteursStatut";
import { useLigneCiblee } from "@/hooks/useLigneCiblee";
import { reponseDevisSchema, type ReponseDevisFormInput, type ReponseDevisFormValues } from "../schemas";
import { CATEGORIE_DEPENSE_LABELS, etalementLabel } from "@/utils/depense";
import { DEVIS_COMPTEUR_LABELS, DEVIS_STATUT_LABELS, STATUTS_DEVIS } from "@/utils/devis";
import { formatDate, formatMontant } from "@/utils/format";
import type { DevisResponse, StatutDevis } from "@/api/types";

const STATUTS_COMPTEURS = STATUTS_DEVIS;
const LIBELLES_COMPTEURS: Record<StatutDevis, string> = { ...DEVIS_COMPTEUR_LABELS, EN_ATTENTE: "À valider" };

type Reponse = "renegocier" | "rejeter";

/** Devis de travaux que l'agence soumet au bailleur : il accepte, demande une renégociation ou rejette. */
export function BailleurDevisPage() {
  const [statutFilter, setStatutFilter] = useState<StatutDevis | "">("");
  const [idCourFilter, setIdCourFilter] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [ouvert, setOuvert] = useState<DevisResponse | null>(null);
  // Réponse en cours de saisie dans la modale : null = choix des trois réponses
  const [reponse, setReponse] = useState<Reponse | null>(null);
  // Contestation d'un accord que l'agence a enregistré hors plateforme (saisie du motif en cours)
  const [contestation, setContestation] = useState(false);

  // Périmètre (mes cours), statut, cour et pagination sont appliqués côté serveur
  const filtres = { idCour: idCourFilter === "" ? undefined : idCourFilter };
  const devisQuery = useDevisQuery({ ...filtres, statut: statutFilter || undefined, page, size: 20, sort: "createdAt,desc" });
  const compteurs = useCompteursStatut(useDevisQuery, filtres, STATUTS_COMPTEURS);
  const coursQuery = useCoursQuery({ size: 100 });
  const cours = coursQuery.data?.content ?? [];

  // Ligne ciblée par une notification (?cible=<id>) : repérée, ou épinglée en tête si elle n'est pas dans la page
  const { data: lignes, cibleId, effacer: effacerCible } = useLigneCiblee({
    rows: devisQuery.data?.content ?? [],
    getId: (d) => d.idDevis,
    fetchOne: devisApi.get,
    queryKey: ["devis"],
  });

  const accepterMutation = useAccepterDevisMutation();
  const renegocierMutation = useRenegocierDevisMutation();
  const rejeterMutation = useRejeterDevisMutation();
  const contesterMutation = useContesterAccordMutation();
  const form = useForm<ReponseDevisFormInput, unknown, ReponseDevisFormValues>({ resolver: zodResolver(reponseDevisSchema) });

  function ouvrir(devis: DevisResponse) {
    setReponse(null);
    setContestation(false);
    form.reset({ commentaire: "" });
    setOuvert(devis);
  }

  async function accepter() {
    if (!ouvert) return;
    try {
      // Le montant et l'étalement affichés sont renvoyés : l'accord est refusé si l'agence a corrigé le devis entre-temps
      await accepterMutation.mutateAsync({ id: ouvert.idDevis, montant: ouvert.montant, nombreMois: ouvert.nombreMois });
      toast.success("Devis accepté. L'agence est prévenue et peut engager les travaux.");
      setOuvert(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Réponse impossible.");
    }
  }

  async function onContester(values: ReponseDevisFormValues) {
    if (!ouvert) return;
    try {
      await contesterMutation.mutateAsync({ id: ouvert.idDevis, commentaire: values.commentaire });
      toast.success("Accord contesté. Le devis repart en renégociation et l'agence est prévenue.");
      setOuvert(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Contestation impossible.");
    }
  }

  async function onRepondre(values: ReponseDevisFormValues) {
    if (!ouvert || !reponse) return;
    try {
      if (reponse === "renegocier") {
        await renegocierMutation.mutateAsync({ id: ouvert.idDevis, commentaire: values.commentaire });
        toast.success("Demande de renégociation transmise à l'agence.");
      } else {
        await rejeterMutation.mutateAsync({ id: ouvert.idDevis, commentaire: values.commentaire });
        toast.success("Devis rejeté. L'agence est prévenue.");
      }
      setOuvert(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Réponse impossible.");
    }
  }

  const columns: DataTableColumn<DevisResponse>[] = [
    {
      key: "date",
      header: "Reçu le",
      render: (d) => (
        <span>
          {formatDate(d.dateSoumission)}
          {d.statut === "EN_ATTENTE" && d.dateLimiteReponse && (
            <span className="block text-xs text-slate-500">réponse avant le {formatDate(d.dateLimiteReponse)}</span>
          )}
        </span>
      ),
    },
    {
      key: "cour",
      header: "Cour",
      render: (d) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          <span>
            {d.referenceCour}
            {d.nomMaison && <span className="block text-xs text-slate-500">{d.nomMaison}</span>}
          </span>
        </span>
      ),
    },
    {
      key: "libelle",
      header: "Travaux",
      render: (d) => (
        <span>
          {d.libelle}
          <span className="block text-xs text-slate-500">
            {CATEGORIE_DEPENSE_LABELS[d.categorie]}
            {d.prestataire ? ` - ${d.prestataire}` : ""}
          </span>
        </span>
      ),
    },
    { key: "montant", header: "Montant", align: "right", render: (d) => formatMontant(d.montant) },
    { key: "etalement", header: "Retenue proposée", render: (d) => etalementLabel(d) },
    {
      key: "statut",
      header: "Statut",
      render: (d) => (
        <span>
          <StatutBadge statut={d.statut} label={DEVIS_STATUT_LABELS[d.statut]} />
          {d.accordHorsPlateforme && d.statut === "ACCEPTE" && <span className="mt-1 block text-xs text-amber-700">accord enregistré par l&apos;agence</span>}
          {d.pieceJointe && <span className="mt-1 block text-xs text-slate-500">devis PDF joint</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (d) =>
        d.statut === "EN_ATTENTE" ? (
          <Button size="sm" onClick={() => ouvrir(d)}>
            Répondre
          </Button>
        ) : d.statut === "ACCEPTE" && d.accordHorsPlateforme ? (
          <Button size="sm" variant="secondary" onClick={() => ouvrir(d)}>
            Vérifier
          </Button>
        ) : (
          <button
            type="button"
            title="Voir le devis"
            aria-label={`Voir le devis - ${d.libelle}`}
            onClick={() => ouvrir(d)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
          >
            <Eye size={16} aria-hidden="true" />
          </button>
        ),
    },
  ];

  const enAttente = ouvert?.statut === "EN_ATTENTE";
  const peutContester = ouvert?.statut === "ACCEPTE" && ouvert.accordHorsPlateforme;
  const envoi = renegocierMutation.isPending || rejeterMutation.isPending;

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Devis de travaux"
        description="Avant d'engager des travaux à votre charge, l'agence vous en soumet le devis. Vous l'acceptez, vous demandez qu'il soit renégocié, ou vous le rejetez si vous préférez vous en occuper vous-même."
      />

      <CompteursStatut compteurs={compteurs} statuts={STATUTS_COMPTEURS} labels={LIBELLES_COMPTEURS} />

      {devisQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger vos devis"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants ou contactez l'agence si le problème persiste."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-56">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutDevis | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS_DEVIS.map((s) => ({ value: s, label: DEVIS_STATUT_LABELS[s] }))}
              />
            </div>
            {cours.length > 1 && (
              <div className="sm:w-48">
                <Select
                  aria-label="Filtrer par cour"
                  value={idCourFilter}
                  onChange={(e) => {
                    setIdCourFilter(e.target.value ? Number(e.target.value) : "");
                    setPage(0);
                  }}
                  placeholder="Toutes les cours"
                  options={cours.map((c) => ({ value: c.idCour, label: c.referenceCour }))}
                />
              </div>
            )}
          </div>
          <DataTable
            data={lignes}
            highlightKey={cibleId}
            onDismissHighlight={effacerCible}
            columns={columns}
            keyExtractor={(d) => d.idDevis}
            loading={devisQuery.isLoading}
            emptyMessage={statutFilter || idCourFilter !== "" ? "Aucun devis ne correspond à ces filtres" : "Aucun devis reçu pour le moment"}
          />
          {devisQuery.data && (
            <Pagination
              currentPage={devisQuery.data.page.number}
              totalPages={devisQuery.data.page.totalPages}
              totalElements={devisQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={ouvert !== null} onClose={() => setOuvert(null)} title={ouvert?.libelle ?? "Devis"} titleTone="indigo" size="lg">
        {ouvert && (
          <div className="space-y-5">
            <DevisFiche devis={ouvert} vue="bailleur" />

            {enAttente && reponse === null && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <Button className="flex-1" icon={<Check size={16} />} loading={accepterMutation.isPending} onClick={accepter}>
                  Accepter le devis
                </Button>
                <Button variant="secondary" className="flex-1" icon={<MessageSquare size={16} />} onClick={() => setReponse("renegocier")}>
                  Demander une renégociation
                </Button>
                <Button variant="danger" className="flex-1" icon={<X size={16} />} onClick={() => setReponse("rejeter")}>
                  Rejeter
                </Button>
              </div>
            )}

            {peutContester && !contestation && (
              <div className="border-t border-slate-100 pt-4">
                <Button variant="danger" icon={<ShieldAlert size={16} />} onClick={() => setContestation(true)}>
                  Je ne reconnais pas cet accord
                </Button>
              </div>
            )}

            {peutContester && contestation && (
              <form className="space-y-3 border-t border-slate-100 pt-4" onSubmit={form.handleSubmit(onContester)} noValidate>
                <Textarea
                  label="Pourquoi contestez-vous cet accord ?"
                  required
                  rows={3}
                  placeholder="Ex. je n'ai pas donné d'accord, le montant n'est pas celui dont nous avions parlé"
                  helperText="Le devis repart en renégociation : l'agence devra vous le soumettre à nouveau et obtenir votre réponse."
                  error={form.formState.errors.commentaire?.message}
                  {...form.register("commentaire")}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setContestation(false)}>
                    Retour
                  </Button>
                  <Button type="submit" variant="danger" className="flex-1" loading={contesterMutation.isPending}>
                    Contester l&apos;accord
                  </Button>
                </div>
              </form>
            )}

            {enAttente && reponse !== null && (
              <form className="space-y-3 border-t border-slate-100 pt-4" onSubmit={form.handleSubmit(onRepondre)} noValidate>
                <Textarea
                  label={reponse === "renegocier" ? "Que souhaitez-vous voir revu ?" : "Pourquoi rejetez-vous ce devis ?"}
                  required
                  rows={3}
                  placeholder={
                    reponse === "renegocier"
                      ? "Ex. montant trop élevé, autre artisan à consulter, étalement sur plus de mois"
                      : "Ex. je ferai réaliser ces travaux moi-même"
                  }
                  helperText={
                    reponse === "renegocier"
                      ? "L'agence révise le devis et vous le soumet à nouveau."
                      : "Le devis est clos : l'agence n'engage pas ces travaux et rien n'est retenu sur vos reversements."
                  }
                  error={form.formState.errors.commentaire?.message}
                  {...form.register("commentaire")}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setReponse(null)}>
                    Retour
                  </Button>
                  <Button type="submit" variant={reponse === "rejeter" ? "danger" : "primary"} className="flex-1" loading={envoi}>
                    {reponse === "renegocier" ? "Envoyer la demande" : "Rejeter le devis"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

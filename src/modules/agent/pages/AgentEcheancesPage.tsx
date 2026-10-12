import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Banknote, Building2, Calendar, FileSignature, Home, User } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, RemoteCombobox, SearchInput, Select, StatutBadge } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import { useEcheancesQuery } from "@/hooks/queries/useEcheances";
import { useCoursAvecMandatOptions } from "@/hooks/useOptionsSelection";
import { useCreatePaiementMutation } from "@/hooks/queries/usePaiements";
import { encaisserPaiementSchema, type EncaisserPaiementFormInput, type EncaisserPaiementFormValues } from "../schemas";
import { statutLabel } from "@/utils/statut";
import { formatDate, formatMontant } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { EcheanceResponse, StatutEcheance } from "@/api/types";

const STATUTS: StatutEcheance[] = ["EN_ATTENTE", "PAYE", "EN_RETARD", "ANNULE"];

export function AgentEcheancesPage() {
  const [onglet, setOnglet] = useState<"LOCATION" | "MANDAT">("LOCATION");
  const locationRecherche = useRechercheServeur();
  const mandatRecherche = useRechercheServeur();
  const [statutFilterLocation, setStatutFilterLocation] = useState<StatutEcheance | "">("");
  const [statutFilterMandat, setStatutFilterMandat] = useState<StatutEcheance | "">("");
  const [courFilterMandat, setCourFilterMandat] = useState("");
  const [encaissing, setEncaissing] = useState<EcheanceResponse | null>(null);

  // Recherche, filtres et pagination sont appliqués côté serveur ; les libellés (maison, locataire, cour, propriétaire) viennent de la réponse
  const echeancesLocationQuery = useEcheancesQuery({
    type: "LOCATION",
    page: locationRecherche.page,
    size: 20,
    sort: "dateEcheance,desc",
    statut: statutFilterLocation || undefined,
    recherche: locationRecherche.recherche || undefined,
  });
  const echeancesMandatQuery = useEcheancesQuery({
    type: "MANDAT",
    page: mandatRecherche.page,
    size: 20,
    sort: "dateEcheance,desc",
    statut: statutFilterMandat || undefined,
    referenceCour: courFilterMandat || undefined,
    recherche: mandatRecherche.recherche || undefined,
  });
  const encaisserMutation = useCreatePaiementMutation();

  const encaisserForm = useForm<EncaisserPaiementFormInput, unknown, EncaisserPaiementFormValues>({
    resolver: zodResolver(encaisserPaiementSchema),
  });

  const echeancesLocation = echeancesLocationQuery.data?.content ?? [];
  const echeancesMandat = echeancesMandatQuery.data?.content ?? [];

  function resteDu(e: EcheanceResponse): number {
    // Le solde exigé par le backend pour marquer l'échéance PAYE est montantDu + pénalité - montantPaye :
    // la pénalité n'est jamais incluse dans montantDu, il faut l'ajouter explicitement ici.
    return e.montantDu + (e.penalite ?? 0) - e.montantPaye;
  }

  function openEncaisser(e: EcheanceResponse) {
    setEncaissing(e);
    encaisserForm.reset({ montantPaiement: resteDu(e), modePaiement: "", referencePaiement: "" });
  }

  async function onEncaisser(values: EncaisserPaiementFormValues) {
    if (!encaissing) return;
    try {
      await encaisserMutation.mutateAsync({ ...values, idEcheances: [encaissing.idEcheance] });
      toast.success("Paiement encaissé.");
      setEncaissing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Encaissement impossible.");
    }
  }

  const locationColumns: DataTableColumn<EcheanceResponse>[] = [
    {
      key: "entite",
      header: "Maison - Locataire",
      render: (e) => (e.nomCommunMaison ? `${e.nomCommunMaison} - ${e.nomLocataire}` : `Contrat #${e.entiteId}`),
    },
    {
      key: "periode",
      header: "Période",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {e.moisLibelle ?? formatDate(e.dateEcheance)}
        </span>
      ),
    },
    { key: "du", header: "Dû", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "paye", header: "Payé", align: "right", render: (e) => formatMontant(e.montantPaye) },
    {
      key: "penalite",
      header: "Pénalité",
      align: "right",
      render: (e) => (e.penalite ? <span className="font-medium text-danger-600">{formatMontant(e.penalite)}</span> : "-"),
    },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) => {
        if (e.statut !== "EN_ATTENTE" && e.statut !== "EN_RETARD") return "-";
        const items: ActionGroupItem[] = [
          { label: "Encaisser le loyer", text: "Encaisser", icon: <Banknote size={15} aria-hidden="true" />, onClick: () => openEncaisser(e) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  const mandatColumns: DataTableColumn<EcheanceResponse>[] = [
    {
      key: "mandat",
      header: "Mandat",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {e.referenceCour ?? `Mandat #${e.entiteId}`}
        </span>
      ),
    },
    {
      key: "proprietaire",
      header: "Propriétaire",
      render: (e) => (
        <span className="flex items-center gap-2">
          <User size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {e.nomProprietaire ?? "-"}
        </span>
      ),
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (e) => {
        return e.commissionMandat != null ? `${e.commissionMandat}%` : "-";
      },
    },
    {
      key: "periode",
      header: "Période",
      render: (e) => (
        <span className="flex items-center gap-2">
          <Calendar size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
          {e.moisLibelle ?? formatDate(e.dateEcheance)}
        </span>
      ),
    },
    { key: "du", header: "Dû", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "paye", header: "Payé", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Échéances"
        description="Le suivi des loyers dus par les locataires et des commissions dues par les mandats de gestion."
      />

      <div className="mb-6 inline-flex rounded-xl border border-primary-100 bg-primary-50/60 p-1">
        <button
          type="button"
          onClick={() => setOnglet("LOCATION")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            onglet === "LOCATION" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Home size={15} aria-hidden="true" />
          Loyers (locations)
        </button>
        <button
          type="button"
          onClick={() => setOnglet("MANDAT")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            onglet === "MANDAT" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileSignature size={15} aria-hidden="true" />
          Commissions (mandats)
        </button>
      </div>

      {onglet === "LOCATION" && (
        <section>
          <p className="mb-3 text-xs text-slate-500">
            Aucune passerelle de paiement en ligne n'étant intégrée, c'est l'agent qui encaisse le loyer et l'enregistre ici.
          </p>
          {echeancesLocationQuery.isError ? (
            <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger ces échéances" description="Réessayez dans quelques instants." />
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="sm:w-44">
                  <Select
                    aria-label="Filtrer par statut (locations)"
                    value={statutFilterLocation}
                    onChange={(e) => {
                      setStatutFilterLocation(e.target.value as StatutEcheance | "");
                      locationRecherche.setPage(0);
                    }}
                    placeholder="Tous les statuts"
                    options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
                  />
                </div>
                <div className="sm:w-64">
                  <SearchInput
                    value={locationRecherche.search}
                    onChange={locationRecherche.setSearch}
                    placeholder="Rechercher une maison, un locataire, une période…"
                    ariaLabel="Rechercher parmi les échéances de location"
                  />
                </div>
              </div>
              <DataTable
                data={echeancesLocation}
                columns={locationColumns}
                keyExtractor={(e) => e.idEcheance}
                loading={echeancesLocationQuery.isLoading}
                emptyMessage={
                  locationRecherche.search || statutFilterLocation ? "Aucune échéance ne correspond à votre recherche" : "Aucune échéance de loyer pour le moment"
                }
              />
              {echeancesLocationQuery.data && (
                <Pagination
                  currentPage={echeancesLocationQuery.data.page.number}
                  totalPages={echeancesLocationQuery.data.page.totalPages}
                  totalElements={echeancesLocationQuery.data.page.totalElements}
                  onPageChange={locationRecherche.setPage}
                />
              )}
            </>
          )}
        </section>
      )}

      {onglet === "MANDAT" && (
        <section>
          <p className="mb-3 text-xs text-slate-500">Voir aussi « Reversements bailleurs » pour calculer et régler ces commissions.</p>
          {echeancesMandatQuery.isError ? (
            <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger ces échéances" description="Réessayez dans quelques instants." />
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="sm:w-44">
                  <RemoteCombobox
                    placeholder="Toutes les cours"
                    useOptions={useCoursAvecMandatOptions}
                    onChange={(e) => {
                      setCourFilterMandat(e.target.value);
                      mandatRecherche.setPage(0);
                    }}
                  />
                </div>
                <div className="sm:w-44">
                  <Select
                    aria-label="Filtrer par statut (mandats)"
                    value={statutFilterMandat}
                    onChange={(e) => {
                      setStatutFilterMandat(e.target.value as StatutEcheance | "");
                      mandatRecherche.setPage(0);
                    }}
                    placeholder="Tous les statuts"
                    options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
                  />
                </div>
                <div className="sm:w-64">
                  <SearchInput
                    value={mandatRecherche.search}
                    onChange={mandatRecherche.setSearch}
                    placeholder="Rechercher un mandat, une période…"
                    ariaLabel="Rechercher parmi les échéances de mandat"
                  />
                </div>
              </div>
              <DataTable
                data={echeancesMandat}
                columns={mandatColumns}
                keyExtractor={(e) => e.idEcheance}
                loading={echeancesMandatQuery.isLoading}
                emptyMessage={
                  mandatRecherche.search || statutFilterMandat || courFilterMandat
                    ? "Aucune échéance ne correspond à votre recherche"
                    : "Aucune échéance de mandat pour le moment"
                }
              />
              {echeancesMandatQuery.data && (
                <Pagination
                  currentPage={echeancesMandatQuery.data.page.number}
                  totalPages={echeancesMandatQuery.data.page.totalPages}
                  totalElements={echeancesMandatQuery.data.page.totalElements}
                  onPageChange={mandatRecherche.setPage}
                />
              )}
            </>
          )}
        </section>
      )}

      <Modal isOpen={encaissing !== null} onClose={() => setEncaissing(null)} title="Encaisser le loyer" titleTone="indigo">
        {encaissing && (
          <form className="space-y-4" onSubmit={encaisserForm.handleSubmit(onEncaisser)} noValidate>
            <p className="text-sm text-slate-600">
              {encaissing.nomCommunMaison ?? `Contrat #${encaissing.entiteId}`} -{" "}
              {encaissing.moisLibelle ?? formatDate(encaissing.dateEcheance)}
              <br />
              Reste dû : <span className="font-semibold text-slate-900">{formatMontant(resteDu(encaissing))}</span>
              {encaissing.penalite ? <span className="text-danger-600"> (dont {formatMontant(encaissing.penalite)} de pénalité de retard)</span> : null}
            </p>
            <Input
              label="Montant encaissé"
              type="number"
              min={0}
              step="any"
              required
              error={encaisserForm.formState.errors.montantPaiement?.message}
              {...encaisserForm.register("montantPaiement")}
            />
            <Input
              label="Mode de paiement"
              placeholder="ESPECES, VIREMENT_BANCAIRE, MOBILE_MONEY…"
              required
              error={encaisserForm.formState.errors.modePaiement?.message}
              {...encaisserForm.register("modePaiement")}
            />
            <Input label="Référence" {...encaisserForm.register("referencePaiement")} />
            <Button type="submit" fullWidth loading={encaisserMutation.isPending}>
              Encaisser
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

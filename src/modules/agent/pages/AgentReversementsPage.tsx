import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Banknote, Calculator, Calendar, Layers } from "lucide-react";
import { Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, RemoteCombobox, StatutBadge } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ActionGroup } from "@/components/ui";
import { useContratMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useMandatsActifsOptions } from "@/hooks/useOptionsSelection";
import {
  useCalculerReversementMutation,
  useCalculerReversementsTousMutation,
  useConfirmerVirementMutation,
  useEcheancesEnRetardMandatQuery,
  useEcheancesQuery,
} from "@/hooks/queries/useEcheances";
import {
  calculerReversementSchema,
  confirmerVirementSchema,
  type CalculerReversementFormInput,
  type CalculerReversementFormValues,
  type ConfirmerVirementFormInput,
  type ConfirmerVirementFormValues,
} from "../schemas";
import { formatDate, formatMontant } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { EcheanceMandatResponse, EcheanceResponse } from "@/api/types";

function moisCourant(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AgentReversementsPage() {
  const [idMandatSelectionne, setIdMandatSelectionne] = useState<number | "">("");
  const [periodeFiltre, setPeriodeFiltre] = useState(moisCourant());
  const [calculOpen, setCalculOpen] = useState(false);
  const [calculTousOpen, setCalculTousOpen] = useState(false);
  const [confirmingVirement, setConfirmingVirement] = useState<EcheanceResponse | null>(null);
  const [page, setPage] = useState(0);

  // Le mandat choisi est relu par son id : sa date de début borne la période, même s'il n'est plus dans les résultats de recherche
  const { data: mandatSelectionne } = useContratMandatQuery(idMandatSelectionne === "" ? undefined : idMandatSelectionne);
  const enRetardQuery = useEcheancesEnRetardMandatQuery();
  // Mois, mandat et pagination sont appliqués côté serveur ; la référence de cour vient de la réponse
  const echeancesMandatQuery = useEcheancesQuery({
    type: "MANDAT",
    page,
    size: 20,
    sort: "dateEcheance,desc",
    periode: periodeFiltre || undefined,
    entiteId: idMandatSelectionne === "" ? undefined : idMandatSelectionne,
  });

  const calculerMutation = useCalculerReversementMutation();
  const calculerTousMutation = useCalculerReversementsTousMutation();
  const confirmerMutation = useConfirmerVirementMutation();

  const calculForm = useForm<CalculerReversementFormInput, unknown, CalculerReversementFormValues>({
    resolver: zodResolver(calculerReversementSchema),
  });
  const calculTousForm = useForm<CalculerReversementFormInput, unknown, CalculerReversementFormValues>({
    resolver: zodResolver(calculerReversementSchema),
  });
  const virementForm = useForm<ConfirmerVirementFormInput, unknown, ConfirmerVirementFormValues>({
    resolver: zodResolver(confirmerVirementSchema),
  });

  const calcules = echeancesMandatQuery.data?.content ?? [];

  async function onCalculer(values: CalculerReversementFormValues) {
    if (idMandatSelectionne === "") return;
    try {
      await calculerMutation.mutateAsync({ idMandat: idMandatSelectionne, periode: values.periode });
      toast.success("Reversement calculé.");
      calculForm.reset({});
      setCalculOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Calcul du reversement impossible.");
    }
  }

  async function onCalculerTous(values: CalculerReversementFormValues) {
    try {
      const { succes, ignores, raisons } = await calculerTousMutation.mutateAsync({ periode: values.periode });
      if (succes > 0) toast.success(`${succes} reversement${succes > 1 ? "s" : ""} calculé${succes > 1 ? "s" : ""}.`);
      if (ignores > 0) {
        const detail = raisons.map((r) => `${r.message} (${r.nombre})`).join(" ; ");
        toast.info(`${ignores} mandat${ignores > 1 ? "s" : ""} ignoré${ignores > 1 ? "s" : ""} : ${detail}`);
      }
      calculTousForm.reset({});
      setCalculTousOpen(false);
    } catch {
      toast.error("Le calcul groupé a échoué.");
    }
  }

  async function onConfirmerVirement(values: ConfirmerVirementFormValues) {
    if (!confirmingVirement) return;
    try {
      await confirmerMutation.mutateAsync({ idEcheance: confirmingVirement.idEcheance, body: values });
      toast.success("Virement confirmé.");
      setConfirmingVirement(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Confirmation du virement impossible.");
    }
  }

  const retardColumns: DataTableColumn<EcheanceMandatResponse>[] = [
    { key: "mandat", header: "Mandat", render: (e) => e.referenceCour ?? `Mandat #${e.idMandat}` },
    { key: "periode", header: "Période", render: (e) => formatDate(e.periodeMois) },
    { key: "du", header: "Montant dû", align: "right", render: (e) => formatMontant(e.montantLoyersDus) },
    { key: "commission", header: "Commission", align: "right", render: (e) => formatMontant(e.commissionDeduite) },
    { key: "net", header: "Net à reverser", align: "right", render: (e) => formatMontant(e.montantNetAReverser) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
  ];

  const calculesColumns: DataTableColumn<EcheanceResponse>[] = [
    { key: "mandat", header: "Mandat", render: (e) => e.referenceCour ?? `Mandat #${e.entiteId}` },
    { key: "periode", header: "Période", render: (e) => e.moisLibelle ?? formatDate(e.dateEcheance) },
    {
      key: "du",
      header: "Montant dû",
      align: "right",
      render: (e) => formatMontant(e.montantDu + (e.commissionDeduite ?? 0)),
    },
    { key: "commission", header: "Commission", align: "right", render: (e) => formatMontant(e.commissionDeduite) },
    { key: "net", header: "Net à reverser", align: "right", render: (e) => formatMontant(e.montantDu) },
    { key: "verse", header: "Versé", align: "right", render: (e) => formatMontant(e.montantPaye) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (e) => {
        if (e.statut !== "EN_ATTENTE" && e.statut !== "EN_RETARD") return "-";
        const items: ActionGroupItem[] = [
          {
            label: "Confirmer le virement",
            text: "Confirmer le virement",
            icon: <Banknote size={15} aria-hidden="true" />,
            onClick: () => {
              setConfirmingVirement(e);
              virementForm.reset({});
            },
          },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Reversements aux bailleurs"
        description="Calculez et confirmez les virements dus aux bailleurs pour leurs mandats de gestion (loyers encaissés moins commission)."
      />

      {(enRetardQuery.isError || (enRetardQuery.data?.length ?? 0) > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Mandats en retard de reversement</h2>
          {enRetardQuery.isError ? (
            <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les retards" description="Réessayez dans quelques instants." />
          ) : (
            <DataTable
              data={enRetardQuery.data ?? []}
              columns={retardColumns}
              keyExtractor={(e) => e.idEcheance}
              loading={enRetardQuery.isLoading}
              emptyMessage="Aucun mandat en retard de reversement."
            />
          )}
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Calculer et gérer un reversement</h2>
          <Button
            variant="secondary"
            size="sm"
            icon={<Layers size={15} />}
            onClick={() => {
              calculTousForm.reset({});
              setCalculTousOpen(true);
            }}
          >
            Calculer pour tous les mandats actifs
          </Button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Le reversement d'un mandat n'est jamais généré automatiquement : s'il n'est jamais calculé, il n'apparaîtra ni ici ni en retard. Lancez le
          calcul groupé chaque mois pour être sûr de n'oublier aucun mandat actif.
        </p>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:w-44">
            <Input
              label=""
              aria-label="Filtrer par mois"
              type="month"
              value={periodeFiltre}
              onChange={(e) => {
                setPeriodeFiltre(e.target.value);
                setPage(0);
              }}
              icon={<Calendar size={15} />}
            />
          </div>
          <div className="sm:w-72">
            <RemoteCombobox
              placeholder="Tous les mandats actifs"
              useOptions={useMandatsActifsOptions}
              onChange={(e) => {
                setIdMandatSelectionne(e.target.value ? Number(e.target.value) : "");
                setPage(0);
              }}
            />
          </div>
          <Button
            variant="accent"
            icon={<Calculator size={16} />}
            disabled={idMandatSelectionne === ""}
            onClick={() => {
              calculForm.reset({});
              setCalculOpen(true);
            }}
          >
            Calculer un reversement
          </Button>
        </div>

        {echeancesMandatQuery.isError ? (
          <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les reversements" description="Réessayez dans quelques instants." />
        ) : (
          <>
            <DataTable
              data={calcules}
              columns={calculesColumns}
              keyExtractor={(e) => e.idEcheance}
              loading={echeancesMandatQuery.isLoading}
              emptyMessage="Aucun reversement calculé pour ce mois."
            />
            {echeancesMandatQuery.data && (
              <Pagination
                currentPage={echeancesMandatQuery.data.page.number}
                totalPages={echeancesMandatQuery.data.page.totalPages}
                totalElements={echeancesMandatQuery.data.page.totalElements}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <Modal isOpen={calculOpen} onClose={() => setCalculOpen(false)} title="Calculer un reversement" titleTone="indigo">
        <form className="space-y-4" onSubmit={calculForm.handleSubmit(onCalculer)} noValidate>
          <Input
            label="Période (mois à calculer)"
            type="date"
            required
            min={mandatSelectionne?.dateDebut?.slice(0, 7).concat("-01")}
            error={calculForm.formState.errors.periode?.message}
            {...calculForm.register("periode")}
          />
          <Button type="submit" fullWidth loading={calculerMutation.isPending}>
            Calculer
          </Button>
        </form>
      </Modal>

      <Modal isOpen={calculTousOpen} onClose={() => setCalculTousOpen(false)} title="Calculer pour tous les mandats actifs" titleTone="indigo">
        <form className="space-y-4" onSubmit={calculTousForm.handleSubmit(onCalculerTous)} noValidate>
          <p className="text-sm text-slate-600">
            Calcule le reversement de la période choisie pour tous les mandats actifs. Les mandats déjà calculés pour cette période sont ignorés
            sans erreur bloquante.
          </p>
          <Input
            label="Période (mois à calculer)"
            type="date"
            required
            error={calculTousForm.formState.errors.periode?.message}
            {...calculTousForm.register("periode")}
          />
          <Button type="submit" fullWidth loading={calculerTousMutation.isPending}>
            Calculer pour tous
          </Button>
        </form>
      </Modal>

      <Modal isOpen={confirmingVirement !== null} onClose={() => setConfirmingVirement(null)} title="Confirmer le virement" titleTone="indigo">
        {confirmingVirement && (
          <form className="space-y-4" onSubmit={virementForm.handleSubmit(onConfirmerVirement)} noValidate>
            <p className="text-sm text-slate-600">
              Montant net à reverser : <span className="font-semibold text-slate-900">{formatMontant(confirmingVirement.montantDu)}</span>
              {" - "}période {confirmingVirement.moisLibelle ?? formatDate(confirmingVirement.dateEcheance)}
            </p>
            <Input
              label="Mode de versement"
              placeholder="VIREMENT_BANCAIRE, MOBILE_MONEY…"
              required
              error={virementForm.formState.errors.modeVersement?.message}
              {...virementForm.register("modeVersement")}
            />
            <Input label="Référence" {...virementForm.register("reference")} />
            <Button type="submit" fullWidth loading={confirmerMutation.isPending}>
              Confirmer le virement
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertTriangle, Banknote, Calculator, Calendar, CheckCircle2, Clock, Layers, List } from "lucide-react";
import { Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, RemoteCombobox, Select, StatCard, StatutBadge } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ActionGroup } from "@/components/ui";
import { useContratsMandatQuery } from "@/hooks/queries/useContratsMandat";
import { useMandatsActifsOptions } from "@/hooks/useOptionsSelection";
import {
  useCalculerCumulMutation,
  useCalculerCumulTousMutation,
  useCalculerReversementMutation,
  useCalculerReversementsTousMutation,
  useConfirmerVirementMutation,
  useEcheancesCompteurs,
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
import { formatDate, formatMonth, formatMontant } from "@/utils/format";
import { moisOccupation } from "@/utils/mandat";
import { ApiError } from "@/api/http";
import type { CalculCumulResponse, CalculGroupeMandatsResponse } from "@/api/echeances";
import type { ContratMandatResponse, EcheanceMandatResponse, EcheanceResponse, ModeFacturation } from "@/api/types";

function moisCourant(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Mois "yyyy-MM" d'un champ month vers la date "yyyy-MM-01" attendue par l'API. */
function premierDuMois(mois: string): string {
  return `${mois}-01`;
}

function notifierGroupe({ succes, ignores, raisons }: CalculGroupeMandatsResponse) {
  if (succes > 0) toast.success(`${succes} reversement${succes > 1 ? "s" : ""} calculé${succes > 1 ? "s" : ""}.`);
  if (ignores > 0) {
    const detail = raisons.map((r) => `${r.message} (${r.nombre})`).join(" ; ");
    toast.info(`${ignores} mandat${ignores > 1 ? "s" : ""} ignoré${ignores > 1 ? "s" : ""} : ${detail}`);
  }
  if (succes === 0 && ignores === 0) toast.info("Aucun mandat à calculer.");
}

type CalculMandat = { mandat: ContratMandatResponse; mode: "MENSUEL" | "CUMUL" };

export function AgentReversementsPage() {
  const [idMandatSelectionne, setIdMandatSelectionne] = useState<number | "">("");
  const [periodeFiltre, setPeriodeFiltre] = useState(moisCourant());
  const [modeFiltre, setModeFiltre] = useState<"" | "MENSUEL" | "CUMUL">("");
  const [calculMandat, setCalculMandat] = useState<CalculMandat | null>(null);
  const [calculTousMode, setCalculTousMode] = useState<"MENSUEL" | "CUMUL" | null>(null);
  const [jusquA, setJusquA] = useState(moisCourant());
  const [resultatCumul, setResultatCumul] = useState<CalculCumulResponse | null>(null);
  const [confirmingVirement, setConfirmingVirement] = useState<EcheanceResponse | null>(null);
  const [page, setPage] = useState(0);

  const mandatsQuery = useContratsMandatQuery({ size: 100 });
  const enRetardQuery = useEcheancesEnRetardMandatQuery();
  // Mois, mandat et pagination sont appliqués côté serveur ; la référence de cour vient de la réponse
  const echeancesMandatQuery = useEcheancesQuery({
    type: "MANDAT",
    page,
    size: 20,
    sort: "dateEcheance,desc",
    periode: periodeFiltre || undefined,
    modeFacturation: modeFiltre || undefined,
    entiteId: idMandatSelectionne === "" ? undefined : idMandatSelectionne,
  });

  const compteurs = useEcheancesCompteurs({
    type: "MANDAT",
    periode: periodeFiltre || undefined,
    modeFacturation: modeFiltre || undefined,
    entiteId: idMandatSelectionne === "" ? undefined : idMandatSelectionne,
  });

  const calculerMutation = useCalculerReversementMutation();
  const calculerTousMutation = useCalculerReversementsTousMutation();
  const calculerCumulMutation = useCalculerCumulMutation();
  const calculerCumulTousMutation = useCalculerCumulTousMutation();
  const confirmerMutation = useConfirmerVirementMutation();

  const calculForm = useForm<CalculerReversementFormInput, unknown, CalculerReversementFormValues>({
    resolver: zodResolver(calculerReversementSchema),
  });
  const virementForm = useForm<ConfirmerVirementFormInput, unknown, ConfirmerVirementFormValues>({
    resolver: zodResolver(confirmerVirementSchema),
  });

  const mandatsGestion = useMemo(() => (mandatsQuery.data?.content ?? []).filter((m) => m.typeMandat === "GESTION"), [mandatsQuery.data]);
  const mandatsActifs = useMemo(() => mandatsGestion.filter((m) => m.statut === "ACTIF"), [mandatsGestion]);
  const mandatsMensuels = useMemo(() => mandatsActifs.filter((m) => m.modeFacturation === "MENSUEL"), [mandatsActifs]);
  const mandatsCumules = useMemo(() => mandatsActifs.filter((m) => m.modeFacturation === "CUMUL"), [mandatsActifs]);
  const statutParMandat = useMemo(() => new Map(mandatsGestion.map((m) => [m.idMandat, m.statut])), [mandatsGestion]);
  const modeParMandat = useMemo(() => {
    const map = new Map<number, ModeFacturation | null>();
    for (const m of mandatsGestion) map.set(m.idMandat, m.modeFacturation);
    return map;
  }, [mandatsGestion]);

  const calcules = echeancesMandatQuery.data?.content ?? [];

  function ouvrirCalcul(mandat: ContratMandatResponse, mode: "MENSUEL" | "CUMUL") {
    calculForm.reset({});
    setJusquA(moisCourant());
    setResultatCumul(null);
    setCalculMandat({ mandat, mode });
  }

  function ouvrirCalculTous(mode: "MENSUEL" | "CUMUL") {
    calculForm.reset({});
    setJusquA(moisCourant());
    setCalculTousMode(mode);
  }

  async function onCalculerMensuel(values: CalculerReversementFormValues) {
    if (!calculMandat) return;
    try {
      await calculerMutation.mutateAsync({ idMandat: calculMandat.mandat.idMandat, periode: values.periode });
      toast.success("Reversement calculé.");
      setCalculMandat(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Calcul du reversement impossible.");
    }
  }

  async function onCalculerCumul() {
    if (!calculMandat || !jusquA) return;
    try {
      const resultat = await calculerCumulMutation.mutateAsync({ idMandat: calculMandat.mandat.idMandat, jusquA: premierDuMois(jusquA) });
      setResultatCumul(resultat);
      // Les mois calculés s'étalent sur plusieurs mois : on montre tous les mois de ce mandat
      setModeFiltre("CUMUL");
      setPeriodeFiltre("");
      setPage(0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Calcul cumulé impossible.");
    }
  }

  async function onCalculerTous(values: CalculerReversementFormValues) {
    try {
      notifierGroupe(await calculerTousMutation.mutateAsync({ periode: values.periode }));
      setCalculTousMode(null);
    } catch {
      toast.error("Le calcul groupé a échoué.");
    }
  }

  async function onCalculerCumulTous() {
    if (!jusquA) return;
    try {
      notifierGroupe(await calculerCumulTousMutation.mutateAsync({ jusquA: premierDuMois(jusquA) }));
      setModeFiltre("CUMUL");
      setPeriodeFiltre("");
      setPage(0);
      setCalculTousMode(null);
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
    {
      key: "mandat",
      header: "Mandat",
      render: (e) => {
        const reference = e.referenceCour ?? `Mandat #${e.idMandat}`;
        const statut = statutParMandat.get(e.idMandat);
        // Un mandat résilié reste redevable des reversements non virés : on l'indique pour lever l'ambiguïté
        return statut === "RESILIE" || statut === "EXPIRE" ? (
          <span>
            {reference} <span className="text-xs text-slate-500">({statut === "RESILIE" ? "mandat résilié" : "mandat expiré"}, reste dû)</span>
          </span>
        ) : (
          reference
        );
      },
    },
    { key: "echeance", header: "Échéance", render: (e) => formatDate(e.periodeMois) },
    { key: "occupation", header: "Occupation", render: (e) => moisOccupation(e.periodeMois) },
    { key: "du", header: "Montant dû", align: "right", render: (e) => formatMontant(e.montantLoyersDus) },
    { key: "commission", header: "Commission", align: "right", render: (e) => formatMontant(e.commissionDeduite) },
    { key: "net", header: "Net à reverser", align: "right", render: (e) => formatMontant(e.montantNetAReverser) },
    { key: "statut", header: "Statut", render: (e) => <StatutBadge statut={e.statut} /> },
  ];

  function mandatsColumns(mode: "MENSUEL" | "CUMUL"): DataTableColumn<ContratMandatResponse>[] {
    return [
      { key: "cour", header: "Cour", render: (m) => m.referenceCour },
      { key: "proprietaire", header: "Bailleur", render: (m) => m.nomProprietaire },
      { key: "commission", header: "Commission", align: "right", render: (m) => (m.commission !== null ? `${m.commission} %` : "-") },
      { key: "debut", header: "Début", render: (m) => formatDate(m.dateDebut) },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (m) => (
          <ActionGroup
            items={[
              {
                label: mode === "MENSUEL" ? "Calculer un mois" : "Calculer jusqu'à un mois",
                text: mode === "MENSUEL" ? "Calculer un mois" : "Calculer jusqu'au mois…",
                icon: <Calculator size={15} aria-hidden="true" />,
                onClick: () => ouvrirCalcul(m, mode),
              },
            ]}
          />
        ),
      },
    ];
  }

  const calculesColumns: DataTableColumn<EcheanceResponse>[] = [
    { key: "mandat", header: "Mandat", render: (e) => e.referenceCour ?? `Mandat #${e.entiteId}` },
    {
      key: "mode",
      header: "Mode",
      render: (e) => (modeParMandat.get(e.entiteId) === "CUMUL" ? "Cumulé" : modeParMandat.get(e.entiteId) === "MENSUEL" ? "Mensuel" : "-"),
    },
    { key: "echeance", header: "Échéance", render: (e) => formatDate(e.dateEcheance) },
    { key: "occupation", header: "Occupation", render: (e) => moisOccupation(e.dateEcheance) },
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

  const detailCumulColumns: DataTableColumn<EcheanceMandatResponse>[] = [
    { key: "echeance", header: "Échéance", render: (e) => formatDate(e.periodeMois) },
    { key: "occupation", header: "Occupation", render: (e) => moisOccupation(e.periodeMois) },
    { key: "du", header: "Montant dû", align: "right", render: (e) => formatMontant(e.montantLoyersDus) },
    { key: "commission", header: "Commission", align: "right", render: (e) => formatMontant(e.commissionDeduite) },
    { key: "net", header: "Net à reverser", align: "right", render: (e) => formatMontant(e.montantNetAReverser) },
  ];

  function sectionMandats(titre: string, description: string, mode: "MENSUEL" | "CUMUL", mandats: ContratMandatResponse[]) {
    return (
      <section className="mb-8">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{titre}</h2>
          <Button variant="secondary" size="sm" icon={<Layers size={15} />} disabled={mandats.length === 0} onClick={() => ouvrirCalculTous(mode)}>
            {mode === "MENSUEL" ? "Calculer le mois pour tous" : "Calculer le cumul pour tous"}
          </Button>
        </div>
        <p className="mb-3 text-xs text-slate-500">{description}</p>
        <DataTable
          data={mandats}
          columns={mandatsColumns(mode)}
          keyExtractor={(m) => m.idMandat}
          loading={mandatsQuery.isLoading}
          emptyMessage={mode === "MENSUEL" ? "Aucun mandat actif en versement mensuel." : "Aucun mandat actif en versement cumulé."}
        />
      </section>
    );
  }

  const cumulEnCours = calculMandat?.mode === "CUMUL";

  return (
    <div>
      <PageHeader
        tone="indigo"
        title="Reversements aux bailleurs"
        description="Calculez et confirmez les virements dus aux bailleurs pour leurs mandats de gestion (loyers dus moins commission)."
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

      {mandatsQuery.isError ? (
        <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger les mandats" description="Réessayez dans quelques instants." />
      ) : (
        <>
          {sectionMandats(
            "Mandats en versement mensuel",
            "Un reversement par mois, jamais généré automatiquement : lancez le calcul chaque mois pour n'oublier aucun mandat.",
            "MENSUEL",
            mandatsMensuels,
          )}
          {sectionMandats(
            "Mandats en versement cumulé",
            "Le bailleur est versé en une fois pour plusieurs mois. Choisissez le mois jusqu'auquel calculer : une échéance est créée pour chaque mois non encore calculé.",
            "CUMUL",
            mandatsCumules,
          )}
        </>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reversements calculés</h2>
        <p className="mb-3 text-xs text-slate-500">
          Une échéance datée du 1er d'un mois correspond à l'occupation du mois précédent. Videz le champ du mois pour voir toutes les périodes.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total" value={compteurs.loading ? "-" : compteurs.total} icon={<List size={20} aria-hidden="true" />} tone="primary" />
          <StatCard label="Versés" value={compteurs.loading ? "-" : compteurs.paye} icon={<CheckCircle2 size={20} aria-hidden="true" />} tone="success" />
          <StatCard label="En retard" value={compteurs.loading ? "-" : compteurs.retard} icon={<AlertTriangle size={20} aria-hidden="true" />} tone="danger" />
          <StatCard label="En attente" value={compteurs.loading ? "-" : compteurs.attente} icon={<Clock size={20} aria-hidden="true" />} tone="warning" />
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:w-44">
            <Input
              label=""
              aria-label="Filtrer par mois d'échéance"
              type="month"
              value={periodeFiltre}
              onChange={(e) => {
                setPeriodeFiltre(e.target.value);
                setPage(0);
              }}
              icon={<Calendar size={15} />}
            />
          </div>
          <div className="sm:w-44">
            <Select
              aria-label="Filtrer par mode"
              value={modeFiltre}
              onChange={(e) => {
                setModeFiltre(e.target.value as "" | "MENSUEL" | "CUMUL");
                setPage(0);
              }}
              placeholder="Tous les modes"
              options={[
                { value: "MENSUEL", label: "Mensuel" },
                { value: "CUMUL", label: "Cumulé" },
              ]}
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
              emptyMessage="Aucun reversement calculé pour cette sélection."
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

      <Modal
        isOpen={calculMandat !== null && !cumulEnCours}
        onClose={() => setCalculMandat(null)}
        title={`Calculer un mois - ${calculMandat?.mandat.referenceCour ?? ""}`}
        titleTone="indigo"
      >
        <form className="space-y-4" onSubmit={calculForm.handleSubmit(onCalculerMensuel)} noValidate>
          <Input
            label="Période (mois à calculer)"
            type="date"
            required
            min={calculMandat?.mandat.dateDebut?.slice(0, 7).concat("-01")}
            error={calculForm.formState.errors.periode?.message}
            {...calculForm.register("periode")}
          />
          <Button type="submit" fullWidth loading={calculerMutation.isPending}>
            Calculer
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={calculMandat !== null && cumulEnCours}
        onClose={() => setCalculMandat(null)}
        title={`Calcul cumulé - ${calculMandat?.mandat.referenceCour ?? ""}`}
        titleTone="indigo"
      >
        {resultatCumul ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {resultatCumul.nombreMois} mois calculé{resultatCumul.nombreMois > 1 ? "s" : ""}. Le virement se confirme ensuite échéance par échéance
              dans la liste des reversements calculés.
            </p>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Loyers dus</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(resultatCumul.montantLoyersDus)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Commission</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(resultatCumul.commissionDeduite)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Net à reverser</dt>
                <dd className="font-semibold text-slate-900">{formatMontant(resultatCumul.montantNetAReverser)}</dd>
              </div>
            </dl>
            <DataTable data={resultatCumul.echeances} columns={detailCumulColumns} keyExtractor={(e) => e.idEcheance} emptyMessage="Aucun mois calculé." />
            <Button fullWidth onClick={() => setCalculMandat(null)}>
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Calculer jusqu'au mois de"
              type="month"
              required
              value={jusquA}
              onChange={(e) => setJusquA(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              {jusquA
                ? `La dernière échéance calculée sera celle du 1er ${formatMonth(premierDuMois(jusquA))} (occupation : ${moisOccupation(premierDuMois(jusquA))}). Les mois déjà calculés sont sautés.`
                : "Choisissez un mois."}
            </p>
            <Button fullWidth disabled={!jusquA} loading={calculerCumulMutation.isPending} onClick={onCalculerCumul}>
              Calculer
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={calculTousMode === "MENSUEL"}
        onClose={() => setCalculTousMode(null)}
        title="Calculer le mois pour tous les mandats mensuels"
        titleTone="indigo"
      >
        <form className="space-y-4" onSubmit={calculForm.handleSubmit(onCalculerTous)} noValidate>
          <p className="text-sm text-slate-600">
            Calcule le reversement de la période choisie pour tous les mandats actifs en versement mensuel. Les mandats déjà calculés pour cette
            période sont ignorés sans erreur bloquante.
          </p>
          <Input
            label="Période (mois à calculer)"
            type="date"
            required
            error={calculForm.formState.errors.periode?.message}
            {...calculForm.register("periode")}
          />
          <Button type="submit" fullWidth loading={calculerTousMutation.isPending}>
            Calculer pour tous
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={calculTousMode === "CUMUL"}
        onClose={() => setCalculTousMode(null)}
        title="Calculer le cumul pour tous les mandats cumulés"
        titleTone="indigo"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Calcule, pour tous les mandats actifs en versement cumulé, une échéance par mois non encore calculé jusqu'au mois choisi.
          </p>
          <Input label="Calculer jusqu'au mois de" type="month" required value={jusquA} onChange={(e) => setJusquA(e.target.value)} />
          <Button fullWidth disabled={!jusquA} loading={calculerCumulTousMutation.isPending} onClick={onCalculerCumulTous}>
            Calculer pour tous
          </Button>
        </div>
      </Modal>

      <Modal isOpen={confirmingVirement !== null} onClose={() => setConfirmingVirement(null)} title="Confirmer le virement" titleTone="indigo">
        {confirmingVirement && (
          <form className="space-y-4" onSubmit={virementForm.handleSubmit(onConfirmerVirement)} noValidate>
            <p className="text-sm text-slate-600">
              Montant net à reverser : <span className="font-semibold text-slate-900">{formatMontant(confirmingVirement.montantDu)}</span>
              {" - "}échéance du {formatDate(confirmingVirement.dateEcheance)} (occupation : {moisOccupation(confirmingVirement.dateEcheance)})
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

import { useState } from "react";
import { AlertTriangle, Eye, FilterX, X } from "lucide-react";
import { ActionGroup, Badge, Button, DataTable, EmptyState, Input, Modal, PageHeader, Pagination, Select } from "@/components/ui";
import type { ActionGroupItem, BadgeVariant, DataTableColumn } from "@/components/ui";
import type { JournalResponse } from "@/api/journal";
import { useJournalEntitesQuery, useJournalQuery } from "@/hooks/queries/useJournalAdmin";
import { formatDateTime } from "@/utils/format";

const ACTIONS: Record<string, { libelle: string; variant: BadgeVariant }> = {
  CREATE: { libelle: "Création", variant: "success" },
  UPDATE: { libelle: "Modification", variant: "info" },
  DELETE: { libelle: "Suppression", variant: "danger" },
};

/** Nom des classes enregistrées par le journal, traduit pour l'affichage ; une classe inconnue garde son nom. */
const ENTITES: Record<string, string> = {
  Avenant: "Avenant",
  Cour: "Cour",
  ContratLocation: "Contrat de location",
  ContratMandat: "Mandat de gestion",
  DecompteSortie: "Décompte de sortie",
  Document: "Document",
  EcheanceLoyer: "Échéance de loyer",
  BienService: "Bien ou service",
  LocationBienService: "Location de bien ou service",
  Maison: "Maison",
  Paiement: "Paiement",
  ParametreSysteme: "Paramètre",
  ReservationMaison: "Réservation de maison",
  Remboursement: "Remboursement",
  User: "Utilisateur",
};

/** Champs techniques présents à chaque modification : ils masqueraient les vrais changements. */
const CHAMPS_BRUITS = new Set(["updatedAt", "userUpdate"]);

const libelleEntite = (entite: string) => ENTITES[entite] ?? entite;

function lireJson(texte: string | null): Record<string, unknown> {
  if (!texte) return {};
  try {
    const valeur: unknown = JSON.parse(texte);
    return valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function formatChamp(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "vide";
  if (typeof valeur === "object") return JSON.stringify(valeur);
  return String(valeur);
}

/** Lignes « champ : avant → après » d'une opération. */
function changements(j: JournalResponse): { champ: string; avant?: string; apres?: string }[] {
  const ancien = lireJson(j.ancienContenu);
  const nouveau = lireJson(j.nouveauContenu);
  const champs = [...new Set([...Object.keys(ancien), ...Object.keys(nouveau)])].filter((c) => j.action !== "UPDATE" || !CHAMPS_BRUITS.has(c));
  return champs.map((champ) => ({
    champ,
    avant: champ in ancien ? formatChamp(ancien[champ]) : undefined,
    apres: champ in nouveau ? formatChamp(nouveau[champ]) : undefined,
  }));
}

interface Filtres {
  action: string;
  entite: string;
  dateDebut: string;
  dateFin: string;
  idUser: number | null;
  auteur: string;
}

const FILTRES_VIDES: Filtres = { action: "", entite: "", dateDebut: "", dateFin: "", idUser: null, auteur: "" };

export function AdminJournalPage() {
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<JournalResponse | null>(null);

  const entitesQuery = useJournalEntitesQuery();
  const journalQuery = useJournalQuery({
    page,
    size: 20,
    action: filtres.action || undefined,
    entite: filtres.entite || undefined,
    dateDebut: filtres.dateDebut || undefined,
    dateFin: filtres.dateFin || undefined,
    idUser: filtres.idUser ?? undefined,
  });

  function changer(partiel: Partial<Filtres>) {
    setFiltres((f) => ({ ...f, ...partiel }));
    setPage(0);
  }

  const filtresActifs = JSON.stringify(filtres) !== JSON.stringify(FILTRES_VIDES);
  const lignes = journalQuery.data?.content ?? [];

  const columns: DataTableColumn<JournalResponse>[] = [
    { key: "dateAction", header: "Date", render: (j) => formatDateTime(j.dateAction) },
    {
      key: "auteur",
      header: "Auteur",
      render: (j) =>
        j.idUser === null ? (
          "-"
        ) : (
          <button
            type="button"
            className="text-left text-primary-700 hover:underline"
            title="Voir uniquement ses opérations"
            onClick={() => changer({ idUser: j.idUser, auteur: j.auteur ?? `Compte n° ${j.idUser}` })}
          >
            {j.auteur ?? `Compte n° ${j.idUser}`}
          </button>
        ),
    },
    {
      key: "action",
      header: "Opération",
      render: (j) => <Badge variant={ACTIONS[j.action]?.variant ?? "neutral"}>{ACTIONS[j.action]?.libelle ?? j.action}</Badge>,
    },
    {
      key: "entite",
      header: "Élément",
      render: (j) => (
        <span>
          {libelleEntite(j.entite)}
          {j.ligneEntite !== null && <span className="text-slate-400"> n° {j.ligneEntite}</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (j) => {
        const items: ActionGroupItem[] = [{ label: "Voir le détail", text: "Détail", icon: <Eye size={15} aria-hidden="true" />, onClick: () => setDetail(j) }];
        return <ActionGroup items={items} />;
      },
    },
  ];

  const optionsEntites = (entitesQuery.data ?? []).map((e) => ({ value: e, label: libelleEntite(e) }));
  const optionsActions = Object.entries(ACTIONS).map(([value, { libelle }]) => ({ value, label: libelle }));

  return (
    <div>
      <PageHeader tone="indigo" title="Journal d'audit" description="Qui a fait quoi, et quand : chaque création, modification et suppression est enregistrée." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Select aria-label="Filtrer par opération" options={optionsActions} placeholder="Toutes les opérations" value={filtres.action} onChange={(e) => changer({ action: e.target.value })} />
        <Select aria-label="Filtrer par élément" options={optionsEntites} placeholder="Tous les éléments" value={filtres.entite} onChange={(e) => changer({ entite: e.target.value })} />
        <Input type="date" aria-label="Du" max={filtres.dateFin || undefined} value={filtres.dateDebut} onChange={(e) => changer({ dateDebut: e.target.value })} />
        <Input type="date" aria-label="Au" min={filtres.dateDebut || undefined} value={filtres.dateFin} onChange={(e) => changer({ dateFin: e.target.value })} />
        {filtresActifs && (
          <Button variant="secondary" icon={<FilterX size={16} />} onClick={() => changer(FILTRES_VIDES)}>
            Effacer
          </Button>
        )}
      </div>

      {filtres.idUser !== null && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 py-1 pl-3 pr-1 text-sm text-primary-700">
          Auteur : <strong>{filtres.auteur}</strong>
          <button type="button" aria-label="Retirer le filtre sur l'auteur" className="rounded-full p-1 hover:bg-primary-100" onClick={() => changer({ idUser: null, auteur: "" })}>
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}

      {journalQuery.isError ? (
        <EmptyState icon={<AlertTriangle size={32} />} title="Impossible de charger le journal" description="Une erreur est survenue côté serveur. Réessayez dans quelques instants." />
      ) : (
        <>
          <DataTable
            data={lignes}
            columns={columns}
            keyExtractor={(j) => j.idJournal}
            loading={journalQuery.isLoading}
            emptyMessage={filtresActifs ? "Aucune opération ne correspond à ces filtres" : "Aucune opération enregistrée"}
          />
          {journalQuery.data && (
            <Pagination
              currentPage={journalQuery.data.page.number}
              totalPages={journalQuery.data.page.totalPages}
              totalElements={journalQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={detail !== null} onClose={() => setDetail(null)} size="lg" title={detail ? `${ACTIONS[detail.action]?.libelle ?? detail.action} - ${libelleEntite(detail.entite)}` : "Détail"} titleTone="indigo">
        {detail && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              {formatDateTime(detail.dateAction)} par <strong>{detail.auteur ?? (detail.idUser !== null ? `compte n° ${detail.idUser}` : "inconnu")}</strong>
              {detail.ligneEntite !== null && <> sur l&apos;élément n° {detail.ligneEntite}</>}.
            </p>
            {changements(detail).length === 0 ? (
              <p className="text-slate-500">Aucun champ enregistré pour cette opération.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Champ</th>
                      {detail.action !== "CREATE" && <th className="px-3 py-2">Avant</th>}
                      {detail.action !== "DELETE" && <th className="px-3 py-2">Après</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {changements(detail).map((c) => (
                      <tr key={c.champ}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{c.champ}</td>
                        {detail.action !== "CREATE" && <td className="break-all px-3 py-2 text-slate-600">{c.avant ?? "-"}</td>}
                        {detail.action !== "DELETE" && <td className="break-all px-3 py-2 font-medium text-slate-800">{c.apres ?? "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detail.action === "UPDATE" && <p className="text-xs text-slate-400">Seuls les champs modifiés sont listés.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

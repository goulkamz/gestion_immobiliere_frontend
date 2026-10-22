import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Edit2 } from "lucide-react";
import { ActionGroup, Badge, Button, DataTable, EmptyState, Input, Modal, PageHeader, Select } from "@/components/ui";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { ApiError } from "@/api/http";
import type { ParametreResponse } from "@/api/types";
import { useParametresAdminQuery, useUpdateParametreMutation } from "@/hooks/queries/useParametresAdmin";

/** Libellé lisible et unité de chaque clé connue ; une clé inconnue s'affiche avec son nom technique. */
const LIBELLES: Record<string, { libelle: string; unite?: string }> = {
  TOLERANCE_LOCATION_JOURS: { libelle: "Tolérance avant retard d'un loyer", unite: "jours" },
  TOLERANCE_MANDAT_JOURS: { libelle: "Tolérance avant retard d'un reversement", unite: "jours" },
  PENALITE_RETARD_MONTANT: { libelle: "Pénalité de retard (montant fixe)", unite: "FCFA" },
  DELAI_EXPIRATION_RESERVATION_HEURES: { libelle: "Expiration d'une réservation non confirmée", unite: "heures" },
  MEDIAS_RETENTION_JOURS: { libelle: "Conservation d'un média supprimé", unite: "jours" },
  MEDIAS_MAX_FICHIERS_PAR_LOT: { libelle: "Fichiers maximum par envoi groupé", unite: "fichiers" },
};

/** Même règles que le serveur (validerFormat), plus l'exigence d'une valeur positive ou nulle pour les nombres. */
function erreurValeur(param: ParametreResponse, saisie: string): string | null {
  const valeur = saisie.trim();
  if (!valeur) return "La valeur est requise";
  if (param.typeValeur === "ENTIER" && !/^\d+$/.test(valeur)) return "Saisissez un nombre entier positif ou nul";
  if (param.typeValeur === "DECIMAL" && !/^\d+(\.\d+)?$/.test(valeur)) return "Saisissez un nombre positif ou nul (point pour les décimales)";
  return null;
}

function formatValeur(param: ParametreResponse): string {
  if (param.typeValeur === "BOOLEEN") return param.valeur.toLowerCase() === "true" ? "Oui" : "Non";
  const unite = LIBELLES[param.cle]?.unite;
  return unite ? `${param.valeur} ${unite}` : param.valeur;
}

export function AdminParametresPage() {
  const parametresQuery = useParametresAdminQuery();
  const updateMutation = useUpdateParametreMutation();
  const [editing, setEditing] = useState<ParametreResponse | null>(null);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function openEdit(p: ParametreResponse) {
    setEditing(p);
    setSaisie(p.valeur);
    setErreur(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const message = erreurValeur(editing, saisie);
    if (message) {
      setErreur(message);
      return;
    }
    try {
      await updateMutation.mutateAsync({ cle: editing.cle, valeur: saisie.trim() });
      toast.success("Paramètre mis à jour.");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible.");
    }
  }

  const columns: DataTableColumn<ParametreResponse>[] = [
    {
      key: "cle",
      header: "Paramètre",
      render: (p) => (
        <div>
          <p className="font-medium text-slate-800">{LIBELLES[p.cle]?.libelle ?? p.cle}</p>
          <p className="font-mono text-xs text-slate-400">{p.cle}</p>
        </div>
      ),
    },
    { key: "description", header: "Rôle", hiddenOnMobile: true, render: (p) => p.description ?? "-" },
    { key: "valeur", header: "Valeur", render: (p) => <Badge variant="info">{formatValeur(p)}</Badge> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => {
        const items: ActionGroupItem[] = [{ label: "Modifier", text: "Modifier", icon: <Edit2 size={15} aria-hidden="true" />, onClick: () => openEdit(p) }];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader tone="indigo" title="Paramètres" description="Les réglages de l'application. Une modification s'applique immédiatement, sans redémarrage." />

      {parametresQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les paramètres"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <DataTable
          data={parametresQuery.data ?? []}
          columns={columns}
          keyExtractor={(p) => p.idParametre}
          loading={parametresQuery.isLoading}
          emptyMessage="Aucun paramètre enregistré"
        />
      )}

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `Modifier - ${LIBELLES[editing.cle]?.libelle ?? editing.cle}` : "Modifier"} titleTone="indigo">
        {editing && (
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            {editing.description && <p className="text-sm text-slate-600">{editing.description}.</p>}
            {editing.typeValeur === "BOOLEEN" ? (
              <Select
                label="Valeur"
                options={[
                  { value: "true", label: "Oui" },
                  { value: "false", label: "Non" },
                ]}
                value={saisie.toLowerCase()}
                onChange={(e) => setSaisie(e.target.value)}
              />
            ) : (
              <Input
                label={LIBELLES[editing.cle]?.unite ? `Valeur (${LIBELLES[editing.cle]?.unite})` : "Valeur"}
                required
                inputMode={editing.typeValeur === "TEXTE" ? "text" : "decimal"}
                value={saisie}
                error={erreur ?? undefined}
                onChange={(e) => {
                  setSaisie(e.target.value);
                  setErreur(null);
                }}
              />
            )}
            <Button type="submit" fullWidth loading={updateMutation.isPending}>
              Enregistrer
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

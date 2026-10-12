import { useState } from "react";
import { AlertTriangle, Eye, Mail, Phone } from "lucide-react";
import { ActionGroup, Button, DataTable, EmptyState, Modal, PageHeader, Pagination, SearchInput, Select, StatutBadge } from "@/components/ui";
import { useRechercheServeur } from "@/hooks/useRechercheServeur";
import type { ActionGroupItem, DataTableColumn } from "@/components/ui";
import { useContactsQuery, useUpdateStatutContactMutation } from "@/hooks/queries/useContacts";
import { statutLabel } from "@/utils/statut";
import { formatDateTime } from "@/utils/format";
import { toast } from "react-toastify";
import { ApiError } from "@/api/http";
import type { ContactResponse, StatutContact } from "@/api/types";

const STATUTS: StatutContact[] = ["NON_LU", "LU", "TRAITE"];

export function AgentContactsPage() {
  const { search, setSearch, recherche, page, setPage } = useRechercheServeur();
  const [statutFilter, setStatutFilter] = useState<StatutContact | "">("");
  const [viewing, setViewing] = useState<ContactResponse | null>(null);

  const contactsQuery = useContactsQuery({ page, size: 20, sort: "dateEnvoi,desc", statut: statutFilter || undefined, recherche: recherche || undefined });
  const statutMutation = useUpdateStatutContactMutation();

  // Filtre statut, recherche et pagination sont appliqués côté serveur
  const contacts = contactsQuery.data?.content ?? [];

  async function openView(contact: ContactResponse) {
    setViewing(contact);
    if (contact.statut === "NON_LU") {
      try {
        await statutMutation.mutateAsync({ id: contact.idContact, body: { statut: "LU" } });
      } catch {
        // pas bloquant pour l'ouverture de la lecture
      }
    }
  }

  async function handleChangeStatut(statut: StatutContact) {
    if (!viewing) return;
    try {
      await statutMutation.mutateAsync({ id: viewing.idContact, body: { statut } });
      setViewing((v) => (v ? { ...v, statut } : v));
      toast.success("Statut mis à jour.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement de statut impossible.");
    }
  }

  const columns: DataTableColumn<ContactResponse>[] = [
    { key: "nom", header: "Nom", render: (c) => c.nomComplet },
    {
      key: "coordonnees",
      header: "Coordonnées",
      render: (c) => (
        <div className="flex flex-col gap-0.5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Mail size={13} className="shrink-0 text-primary-600" aria-hidden="true" />
            {c.email}
          </span>
          {c.telephone && (
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="shrink-0 text-primary-600" aria-hidden="true" />
              {c.telephone}
            </span>
          )}
        </div>
      ),
    },
    { key: "sujet", header: "Sujet", render: (c) => c.sujet ?? "-" },
    { key: "date", header: "Reçu le", render: (c) => formatDateTime(c.dateEnvoi) },
    { key: "statut", header: "Statut", render: (c) => <StatutBadge statut={c.statut} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => {
        const items: ActionGroupItem[] = [
          { label: "Voir le message", text: "Voir", icon: <Eye size={15} aria-hidden="true" />, onClick: () => openView(c) },
        ];
        return <ActionGroup items={items} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader tone="indigo" title="Contacts" description="Les messages envoyés depuis le formulaire de contact du site." />

      {contactsQuery.isError ? (
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Impossible de charger les contacts"
          description="Une erreur est survenue côté serveur. Réessayez dans quelques instants."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-48">
              <Select
                aria-label="Filtrer par statut"
                value={statutFilter}
                onChange={(e) => {
                  setStatutFilter(e.target.value as StatutContact | "");
                  setPage(0);
                }}
                placeholder="Tous les statuts"
                options={STATUTS.map((s) => ({ value: s, label: statutLabel(s) }))}
              />
            </div>
            <div className="sm:w-72">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un nom, un email, un sujet…" ariaLabel="Rechercher parmi les contacts" />
            </div>
          </div>
          <DataTable
            data={contacts}
            columns={columns}
            keyExtractor={(c) => c.idContact}
            loading={contactsQuery.isLoading}
            emptyMessage={search || statutFilter ? "Aucun contact ne correspond à votre recherche" : "Aucun message reçu pour le moment"}
          />
          {contactsQuery.data && (
            <Pagination
              currentPage={contactsQuery.data.page.number}
              totalPages={contactsQuery.data.page.totalPages}
              totalElements={contactsQuery.data.page.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Message - ${viewing.nomComplet}` : "Message"} titleTone="indigo">
        {viewing && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              <p className="flex items-center gap-1.5">
                <Mail size={14} className="text-primary-600" aria-hidden="true" />
                {viewing.email}
              </p>
              {viewing.telephone && (
                <p className="mt-1 flex items-center gap-1.5">
                  <Phone size={14} className="text-primary-600" aria-hidden="true" />
                  {viewing.telephone}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(viewing.dateEnvoi)}</p>
            </div>
            {viewing.sujet && <p className="font-medium text-slate-900">{viewing.sujet}</p>}
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{viewing.message}</p>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Statut :</span>
              <div className="flex gap-2">
                {STATUTS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={viewing.statut === s ? "primary" : "secondary"}
                    disabled={viewing.statut === s || statutMutation.isPending}
                    onClick={() => handleChangeStatut(s)}
                  >
                    {statutLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

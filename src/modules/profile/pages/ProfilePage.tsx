import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Pencil, UserCircle } from "lucide-react";
import { Button, FormCard, Input, PageLayout } from "@/components/ui";
import { useSessionStore } from "@/store/sessionStore";
import { useUpdateProfileMutation } from "@/hooks/queries/useAuth";
import { formatDate } from "@/utils/format";
import { ApiError } from "@/api/http";
import type { UpdateProfileRequest } from "@/api/types";

export function ProfilePage() {
  const profile = useSessionStore((s) => s.profile);
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdateProfileMutation();
  const { register, handleSubmit, reset } = useForm<UpdateProfileRequest>({
    values: profile
      ? {
          nom: profile.nom,
          prenom: profile.prenom,
          telephone: profile.telephone ?? "",
          telephone1: profile.telephone1 ?? "",
          dateNaissance: profile.dateNaissance,
        }
      : undefined,
  });

  if (!profile) return null;

  async function onSubmit(values: UpdateProfileRequest) {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Profil mis à jour.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible.");
    }
  }

  function handleCancel() {
    reset();
    setEditing(false);
  }

  return (
    <PageLayout narrow decorated backgroundImage="/images/maison-1.jpg">
      <FormCard tone="indigo" icon={UserCircle} title="Mon profil" description="Email et rôle ne sont pas modifiables ici." maxWidthClassName="max-w-lg">
        {editing ? (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nom" {...register("nom")} />
              <Input label="Prénom" {...register("prenom")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Téléphone" {...register("telephone")} />
              <Input label="Téléphone secondaire" {...register("telephone1")} />
            </div>
            <Input label="Date de naissance" type="date" {...register("dateNaissance")} />
            <div className="flex gap-3">
              <Button type="submit" loading={updateMutation.isPending}>
                Enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="grid gap-2 text-sm">
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow label="Rôle" value={profile.role} />
              <ProfileRow label="Nom" value={profile.nom} />
              <ProfileRow label="Prénom" value={profile.prenom} />
              <ProfileRow label="Téléphone" value={profile.telephone || "-"} />
              <ProfileRow label="Téléphone secondaire" value={profile.telephone1 || "-"} />
              <ProfileRow label="Date de naissance" value={formatDate(profile.dateNaissance)} last />
            </dl>
            <Button className="mt-6" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
              Modifier
            </Button>
          </>
        )}
      </FormCard>
    </PageLayout>
  );
}

function ProfileRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-slate-100"}`}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

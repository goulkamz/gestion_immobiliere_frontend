import { useState } from "react";
import { toast } from "react-toastify";
import { Copy, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import {
  useTwoFactorConfirmerMutation,
  useTwoFactorDesactiverMutation,
  useTwoFactorInitierMutation,
  useTwoFactorRegenererCodesMutation,
  useTwoFactorStatusQuery,
} from "@/hooks/queries/useAuth";
import { ApiError } from "@/api/http";
import type { TwoFactorSetup } from "@/api/types";

type Dialogue = "activer" | "desactiver" | "regenerer" | null;

/** Carte « Sécurité du compte » : activation, désactivation et codes de secours de la double authentification. */
export function TwoFactorCard() {
  const statusQuery = useTwoFactorStatusQuery();
  const initierMutation = useTwoFactorInitierMutation();
  const confirmerMutation = useTwoFactorConfirmerMutation();
  const desactiverMutation = useTwoFactorDesactiverMutation();
  const regenererMutation = useTwoFactorRegenererCodesMutation();

  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [codesSecours, setCodesSecours] = useState<string[] | null>(null);

  const status = statusQuery.data;
  if (!status || !status.disponible) return null;

  function fermer() {
    setDialogue(null);
    setSetup(null);
    setCode("");
    setMotDePasse("");
  }

  async function ouvrirActivation() {
    try {
      setSetup(await initierMutation.mutateAsync());
      setDialogue("activer");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Activation impossible.");
    }
  }

  async function confirmer() {
    try {
      const res = await confirmerMutation.mutateAsync(code.trim());
      fermer();
      setCodesSecours(res.codesSecours);
      toast.success("Double authentification activée.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Code invalide.");
    }
  }

  async function desactiver() {
    try {
      await desactiverMutation.mutateAsync({ motDePasse, code: code.trim() });
      fermer();
      toast.success("Double authentification désactivée.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Désactivation impossible.");
    }
  }

  async function regenerer() {
    try {
      const res = await regenererMutation.mutateAsync(code.trim());
      fermer();
      setCodesSecours(res.codesSecours);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Génération impossible.");
    }
  }

  async function copierCodes() {
    try {
      await navigator.clipboard.writeText((codesSecours ?? []).join("\n"));
      toast.success("Codes copiés.");
    } catch {
      toast.error("Copie impossible, notez les codes à la main.");
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white/80 p-4">
      <div className="flex items-start gap-3">
        {status.actif ? <ShieldCheck className="mt-0.5 text-emerald-600" size={20} /> : <ShieldOff className="mt-0.5 text-slate-400" size={20} />}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Double authentification</h3>
          {status.actif ? (
            <p className="mt-1 text-sm text-slate-600">
              Activée. Codes de secours restants : <strong>{status.codesSecoursRestants}</strong>. Un appareil de confiance est dispensé du code pendant {status.heuresConfiance} h.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Ajoutez une seconde étape à la connexion avec une application comme Google Authenticator. Facultatif, mais recommandé.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {status.actif ? (
              <>
                <Button size="sm" variant="outline" icon={<KeyRound size={14} />} onClick={() => setDialogue("regenerer")}>
                  Nouveaux codes de secours
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogue("desactiver")}>
                  Désactiver
                </Button>
              </>
            ) : (
              <Button size="sm" loading={initierMutation.isPending} onClick={ouvrirActivation}>
                Activer
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={dialogue === "activer"} onClose={fermer} title="Activer la double authentification" titleTone="indigo">
        {setup && (
          <div className="space-y-4 text-sm text-slate-700">
            <p>1. Scannez ce QR code avec Google Authenticator (ou une application équivalente).</p>
            <img src={setup.qrCode} alt="QR code de la double authentification" className="mx-auto h-48 w-48" />
            <p className="break-all text-xs text-slate-500">
              Saisie manuelle : <span className="font-mono">{setup.secret}</span>
            </p>
            <p>2. Saisissez le code à 6 chiffres affiché pour confirmer.</p>
            <Input label="Code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="flex gap-3">
              <Button loading={confirmerMutation.isPending} disabled={!code.trim()} onClick={confirmer}>
                Activer
              </Button>
              <Button variant="outline" onClick={fermer}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={dialogue === "desactiver"} onClose={fermer} title="Désactiver la double authentification" titleTone="indigo">
        <div className="space-y-4">
          <Input label="Mot de passe" type="password" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          <Input label="Code de vérification" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex gap-3">
            <Button loading={desactiverMutation.isPending} disabled={!motDePasse || !code.trim()} onClick={desactiver}>
              Désactiver
            </Button>
            <Button variant="outline" onClick={fermer}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={dialogue === "regenerer"} onClose={fermer} title="Nouveaux codes de secours" titleTone="indigo">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Les anciens codes seront invalidés. Saisissez un code de votre application pour confirmer.</p>
          <Input label="Code de vérification" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex gap-3">
            <Button loading={regenererMutation.isPending} disabled={!code.trim()} onClick={regenerer}>
              Générer
            </Button>
            <Button variant="outline" onClick={fermer}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={codesSecours !== null} onClose={() => setCodesSecours(null)} title="Codes de secours" titleTone="indigo" closeOnOverlay={false}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Conservez ces codes en lieu sûr. Chacun ne sert qu'une fois et ils ne seront plus affichés.</p>
          <ul className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 font-mono text-sm">
            {(codesSecours ?? []).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Button variant="outline" icon={<Copy size={14} />} onClick={copierCodes}>
              Copier
            </Button>
            <Button onClick={() => setCodesSecours(null)}>J'ai noté mes codes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

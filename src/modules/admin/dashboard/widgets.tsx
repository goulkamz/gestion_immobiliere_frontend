import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, Modal } from "@/components/ui";
import { TOOLTIP_STYLE, couleurTaux, initiales } from "./helpers";
import { SoftCard } from "./financeWidgets";
import type { Slice } from "./helpers";

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-heading text-lg font-semibold text-slate-900">{children}</h2>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Étiquette qui précise si un chiffre dépend de la période choisie ou s'il est un état à ce jour. */
export function PorteeChip({ type }: { type: "periode" | "stock" }) {
  return type === "periode" ? (
    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">Période</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">À ce jour</span>
  );
}

/** Ligne libellé / montant, utilisée dans les cartes financières. */
export function Figure({ label, value, tone = "text-slate-900", hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`truncate font-heading text-lg font-bold ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

/** Variation par rapport à la période précédente ; invisible sans base de comparaison. */
export function TrendBadge({ actuel, precedent, comparaison, onDark = false }: { actuel: number; precedent?: number | null; comparaison: string; onDark?: boolean }) {
  if (precedent === null || precedent === undefined || precedent === 0 || !comparaison) return null;
  const pct = ((actuel - precedent) / Math.abs(precedent)) * 100;
  if (Math.round(pct) === 0) return null;
  const hausse = pct >= 0;
  const Icone = hausse ? TrendingUp : TrendingDown;
  const couleur = hausse ? "text-success-700" : "text-danger-700";
  // Sur fond sombre, le texte coloré seul se lit mal : on le pose sur une pastille claire.
  const forme = onDark ? "mt-1.5 rounded-full bg-white/90 px-2.5 py-0.5" : "mt-0.5";
  return (
    <p className={`inline-flex items-center gap-1 text-[11px] font-semibold ${forme} ${couleur}`}>
      <Icone size={12} aria-hidden="true" />
      {hausse ? "+" : ""}
      {Math.round(pct)} % par rapport {comparaison}
    </p>
  );
}

/** Anneau de répartition avec légende chiffrée ; message neutre si tous les décomptes sont à 0. */
export function DonutCard({
  title,
  subtitle,
  slices,
  centerLabel,
  soft = false,
  icon,
  vertical = false,
}: {
  title: string;
  subtitle: string;
  slices: Slice[];
  centerLabel?: string;
  /** Anneau au-dessus de la légende : pour les cartes étroites (une colonne sur trois). */
  vertical?: boolean;
  /** Carte douce (onglets du tableau de bord) au lieu de la carte standard. */
  soft?: boolean;
  icon?: ReactNode;
}) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const contenu = (
    <>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Aucune donnée pour le moment.</p>
      ) : (
        <div className={`flex flex-col items-center gap-4 ${vertical ? "" : "sm:flex-row"}`}>
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                  {slices.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-2xl font-bold text-slate-900">{total}</span>
              {centerLabel && <span className="text-[11px] text-slate-500">{centerLabel}</span>}
            </div>
          </div>
          <ul className="w-full space-y-2">
            {slices.map((d) => (
              <li key={d.name} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                <span className="truncate text-slate-600">{d.name}</span>
                <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return soft ? (
    <SoftCard title={title} subtitle={subtitle} icon={icon} className="h-full">
      {contenu}
    </SoftCard>
  ) : (
    <Card title={title} subtitle={subtitle} className="h-full">
      {contenu}
    </Card>
  );
}

/** Jauge circulaire sur carte sombre (recouvrement) : la couleur suit les seuils. */
export function GaugeCard({
  title,
  valeur,
  legende,
  lignes,
  icon,
}: {
  title: string;
  valeur: number;
  legende: string;
  lignes: { label: string; value: string }[];
  icon?: ReactNode;
}) {
  const taux = Math.max(0, Math.min(100, valeur));
  const rayon = 62;
  const circ = 2 * Math.PI * rayon;
  const couleur = couleurTaux(taux);
  return (
    <div className="flex h-full flex-col rounded-2xl bg-linear-to-br from-primary-900 to-slate-900 p-5 text-white shadow-sm">
      <div className="flex items-center gap-2">
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-accent-400">{icon}</span>}
        <h3 className="font-heading text-base font-semibold">{title}</h3>
      </div>
      <div className="relative mx-auto my-4 h-40 w-40">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${title} : ${Math.round(taux)} %`}>
          <circle cx="80" cy="80" r={rayon} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="14" />
          <circle
            cx="80"
            cy="80"
            r={rayon}
            fill="none"
            stroke={couleur}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(taux / 100) * circ} ${circ}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-4xl font-bold" style={{ color: couleur }}>
            {Math.round(taux)}
            <span className="text-lg">%</span>
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-primary-200">{legende}</p>
      <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
        {lignes.map((l) => (
          <div key={l.label} className="flex items-baseline justify-between gap-2">
            <dt className="text-primary-200">{l.label}</dt>
            <dd className="font-semibold">{l.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const ATTENTION_ICON = {
  danger: "bg-danger-600",
  warning: "bg-warning-600",
  primary: "bg-primary-600",
} as const;

/** Tuile « À traiter » : même gabarit que les cartes de chiffres ; l'icône est grise quand il n'y a rien à faire. */
export function AttentionTile({
  label,
  value,
  icon,
  tone,
  to,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: keyof typeof ATTENTION_ICON;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-primary-100/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${value > 0 ? ATTENTION_ICON[tone] : "bg-slate-300"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs leading-tight text-slate-500">{label}</p>
      </div>
      <ArrowRight size={14} className="ml-auto shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export interface RankedRow {
  id: number | string;
  nom: string;
  detail: string;
  valeur: string;
  /** Part de la ligne dans le total (0 à 1), affichée en fine barre. */
  part?: number;
}

function Rang({ index, nom, variant }: { index: number; nom: string; variant: "rank" | "avatar" }) {
  if (variant === "avatar") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700" aria-hidden="true">
        {initiales(nom)}
      </span>
    );
  }
  return index === 0 ? (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white" title="Premier" aria-label="Premier">
      <Crown size={15} aria-hidden="true" />
    </span>
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">{index + 1}</span>
  );
}

function Lignes({ rows, variant }: { rows: RankedRow[]; variant: "rank" | "avatar" }) {
  return (
    <ol className="divide-y divide-slate-100">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 py-2.5">
          <Rang index={i} nom={r.nom} variant={variant} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{r.nom}</p>
            <p className="text-xs leading-snug text-slate-400">{r.detail}</p>
            {r.part !== undefined && (
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary-400" style={{ width: `${Math.max(2, Math.round(r.part * 100))}%` }} />
              </div>
            )}
          </div>
          <span className="ml-2 shrink-0 text-sm font-semibold text-slate-900">{r.valeur}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Classement qui reste lisible quand la liste grossit : seules les `max` premières lignes sont affichées,
 * le reste est accessible dans une fenêtre avec recherche. Le total en pied porte sur toute la liste.
 */
export function RankedTable({
  title,
  subtitle,
  icon,
  rows,
  empty,
  footer,
  max = 5,
  variant = "rank",
  soft = false,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  rows: RankedRow[];
  empty: string;
  footer?: { label: string; valeur: string };
  max?: number;
  variant?: "rank" | "avatar";
  /** Carte douce (onglet Finances) au lieu de la carte standard. */
  soft?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? rows.filter((r) => r.nom.toLowerCase().includes(q)) : rows;
  }, [rows, recherche]);

  const contenu = (
    <>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{empty}</p>
      ) : (
        <>
          <Lignes rows={rows.slice(0, max)} variant={variant} />
          {rows.length > max && (
            <button
              type="button"
              onClick={() => setOuvert(true)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              Voir tout ({rows.length})
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          )}
          {footer && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">{footer.label}</span>
              <span className="font-heading font-bold text-slate-900">{footer.valeur}</span>
            </div>
          )}
          <Modal isOpen={ouvert} onClose={() => setOuvert(false)} title={title} size="lg" titleTone="indigo">
            <div className="relative mb-3">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par nom"
                aria-label="Rechercher par nom"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {filtrees.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Aucun résultat.</p> : <Lignes rows={filtrees} variant={variant} />}
            </div>
            {footer && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">{footer.label}</span>
                <span className="font-heading font-bold text-slate-900">{footer.valeur}</span>
              </div>
            )}
          </Modal>
        </>
      )}
    </>
  );

  return soft ? (
    <SoftCard title={title} subtitle={subtitle} icon={icon} className="h-full">
      {contenu}
    </SoftCard>
  ) : (
    <Card title={title} subtitle={subtitle} icon={icon} className="h-full">
      {contenu}
    </Card>
  );
}

/** Barre de répartition à deux ou trois segments avec légende (origine d'un revenu, par exemple). */
export function CompositionBar({ segments }: { segments: { label: string; value: number; color: string; montant: string }[] }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label} : ${s.montant}`} />)}
      </div>
      <ul className="mt-3 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-800">
              {s.montant}
              {total > 0 && <span className="ml-1.5 font-normal text-slate-400">{Math.round((Math.max(0, s.value) / total) * 100)} %</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Onglets en pastille. */
export function Onglets<T extends string>({ onglets, actif, onChange }: { onglets: { id: T; label: string; icon: ReactNode }[]; actif: T; onChange: (id: T) => void }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-primary-100/60 bg-white p-1 shadow-sm" role="tablist">
      {onglets.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={actif === o.id}
          onClick={() => onChange(o.id)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            actif === o.id ? "bg-primary-600 text-white shadow-sm" : "text-slate-600 hover:bg-primary-50"
          }`}
        >
          <span aria-hidden="true">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

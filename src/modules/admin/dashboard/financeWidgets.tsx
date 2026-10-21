import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMontant } from "@/utils/format";
import { TOOLTIP_STYLE } from "./helpers";

/**
 * Éléments visuels de l'onglet Finances : cartes douces sur fond dégradé, barres arrondies, tarte en parts pleines,
 * barre de progression à grand pourcentage. Propres au tableau de bord admin (les composants partagés ne changent pas).
 */

/** Carte douce : ombre teintée indigo, bandeau d'en-tête uni. */
export function SoftCard({
  title,
  subtitle,
  icon,
  action,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white/85 shadow-lg shadow-primary-900/5 ring-1 ring-primary-100/70 backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 bg-primary-50 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm">{icon}</span>
            )}
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-800">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Pastille arrondie (période choisie, chiffre clé). */
export function Pastille({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
        tone === "accent" ? "bg-accent-100 text-accent-800" : "bg-white text-slate-700 ring-1 ring-primary-100/70"
      }`}
    >
      {children}
    </span>
  );
}

function PuceVariation({ actuel, precedent }: { actuel: number; precedent?: number | null }) {
  if (precedent === null || precedent === undefined || precedent === 0) return null;
  const pct = Math.round(((actuel - precedent) / Math.abs(precedent)) * 100);
  if (pct === 0) return null;
  const hausse = pct >= 0;
  const Icone = hausse ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
        hausse ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"
      }`}
    >
      <Icone size={13} aria-hidden="true" />
      {hausse ? "+" : ""}
      {pct} %
    </span>
  );
}

export interface PointBarre {
  libelle: string;
  valeur: number;
}

/** Barres arrondies : toutes en indigo clair, le pic en dégradé indigo du léger au dense. */
function BarresArrondies({ serie }: { serie: PointBarre[] }) {
  const max = Math.max(1, ...serie.map((p) => p.valeur));
  const pic = serie.reduce((meilleur, p, i) => (p.valeur > (serie[meilleur]?.valeur ?? 0) ? i : meilleur), 0);
  return (
    <div className="flex w-full items-end justify-between gap-2" role="img" aria-label="Évolution sur les derniers mois">
      {serie.map((p, i) => {
        const estPic = i === pic && p.valeur > 0;
        return (
          <div key={`${p.libelle}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-20 items-end">
              <div
                title={`${p.libelle} : ${formatMontant(p.valeur)}`}
                className={`w-3.5 rounded-full transition-all ${estPic ? "bg-linear-to-t from-primary-300 to-primary-800" : "bg-primary-200"}`}
                style={{ height: `${Math.max(8, Math.round((p.valeur / max) * 100))}%` }}
              />
            </div>
            <span className={`h-1.5 w-1.5 rounded-full ${estPic ? "bg-accent-500" : "bg-primary-300"}`} aria-hidden="true" />
            <span className="text-[10px] text-slate-500">{p.libelle}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Carte « gains » : grand montant, variation, et barres arrondies des derniers mois. */
export function CarteGain({
  titre,
  valeur,
  precedent,
  comparaison,
  note,
  serie,
}: {
  titre: string;
  valeur: number;
  precedent?: number | null;
  comparaison: string;
  note: string;
  serie: PointBarre[];
}) {
  return (
    <SoftCard className="h-full">
      <p className="text-sm font-semibold text-primary-800 underline decoration-accent-400 decoration-2 underline-offset-4">{titre}</p>
      <p className="mt-3 font-heading text-4xl font-bold text-primary-700">{formatMontant(valeur)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PuceVariation actuel={valeur} precedent={precedent} />
        {precedent !== null && precedent !== undefined && precedent !== 0 && comparaison && (
          <span className="text-[11px] text-slate-400">par rapport {comparaison}</span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
      {serie.length > 0 && (
        <div className="mt-5 border-t border-dashed border-primary-100 pt-4">
          <BarresArrondies serie={serie} />
        </div>
      )}
    </SoftCard>
  );
}

export interface PartTarte {
  name: string;
  value: number;
  color: string;
  /** Couleur du texte posé sur la part : clair sur fond foncé, foncé sur fond clair. */
  text: string;
}

/** Tarte en parts pleines avec nom et pourcentage dans chaque part assez large, légende chiffrée dessous. */
export function TartePleine({ parts }: { parts: PartTarte[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-slate-400">Aucun revenu sur cette période.</p>;

  // Recharts fournit l'angle et le rayon : on place le texte aux deux tiers du rayon.
  const etiquette = (props: { cx?: number; cy?: number; midAngle?: number; outerRadius?: number; percent?: number; index?: number }) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, index = 0 } = props;
    if (percent < 0.1) return null;
    const rad = Math.PI / 180;
    const r = outerRadius * 0.62;
    const x = cx + r * Math.cos(-midAngle * rad);
    const y = cy + r * Math.sin(-midAngle * rad);
    const part = parts[index];
    if (!part) return null;
    return (
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={part.text} fontSize={12} fontWeight={700}>
        <tspan x={x} dy="-0.45em">
          {part.name}
        </tspan>
        <tspan x={x} dy="1.3em" fontWeight={500}>
          {Math.round(percent * 100)} %
        </tspan>
      </text>
    );
  };

  return (
    <div>
      <div className="mx-auto h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={parts} dataKey="value" nameKey="name" outerRadius="100%" innerRadius={0} stroke="#ffffff" strokeWidth={3} label={etiquette} labelLine={false}>
              {parts.map((p) => (
                <Cell key={p.name} fill={p.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatMontant(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-1.5">
        {parts.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            <span className="text-slate-600">{p.name}</span>
            <span className="ml-auto font-semibold text-slate-800">{formatMontant(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barre de progression épaisse avec grand pourcentage (recouvrement, part reversée). */
export function ProgressionGrande({
  libelle,
  pourcent,
  couleur,
  detail,
  chip,
}: {
  libelle: string;
  pourcent: number;
  couleur: string;
  detail?: string;
  /** Étiquette qui précise la portée du chiffre (période ou à ce jour). */
  chip?: ReactNode;
}) {
  const p = Math.max(0, Math.min(100, Math.round(pourcent)));
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-slate-500">{libelle}</p>
          {chip}
        </div>
        <p className="font-heading text-3xl font-bold" style={{ color: couleur }}>
          {p}
          <span className="text-lg">%</span>
        </p>
      </div>
      <div className="mt-1 h-4 overflow-hidden rounded-full bg-primary-100/70 shadow-inner">
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: couleur }} />
      </div>
      {detail && <p className="mt-1.5 text-[11px] text-slate-400">{detail}</p>}
    </div>
  );
}

/**
 * Barre épaisse à plusieurs segments (déjà reversé, à reverser, à venir). La légende ne liste que les segments
 * non nuls ; un message d'état peut la compléter (« tout est à jour », « rien de prévu »).
 */
export function BarreSegmentee({
  segments,
  message,
}: {
  segments: { label: string; value: number; color: string; montant: string }[];
  message?: { texte: string; ton: "ok" | "neutre" };
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const visibles = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-primary-100/70 shadow-inner">
        {total > 0 &&
          visibles.map((s) => <div key={s.label} className="h-full" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label} : ${s.montant}`} />)}
      </div>
      {message && (
        <p className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${message.ton === "ok" ? "text-success-700" : "text-slate-500"}`}>
          {message.ton === "ok" && <CheckCircle2 size={14} aria-hidden="true" />}
          {message.texte}
        </p>
      )}
      {visibles.length > 0 && (
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-3">
          {visibles.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-slate-500">{s.label}</p>
                <p className="font-semibold text-slate-800">{s.montant}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Frise verticale sur une ligne pointillée : la taille de chaque point suit le montant de la tranche. */
export function FriseAnciennete({ etapes }: { etapes: { label: string; montant: number; couleur: string }[] }) {
  const max = Math.max(1, ...etapes.map((e) => e.montant));
  return (
    <div className="relative">
      <div className="absolute bottom-6 left-[22px] top-6 border-l-2 border-dashed border-primary-200" aria-hidden="true" />
      <ol className="relative space-y-1">
        {etapes.map((e) => {
          const taille = 16 + Math.round((e.montant / max) * 26);
          return (
            <li key={e.label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                <span
                  className="rounded-full shadow-md ring-4 ring-white"
                  style={{ width: taille, height: taille, background: e.couleur, opacity: e.montant > 0 ? 1 : 0.3 }}
                />
              </span>
              <span className="text-sm text-slate-600">{e.label}</span>
              <span className={`ml-auto text-sm font-bold ${e.montant > 0 ? "text-slate-900" : "text-slate-400"}`}>{formatMontant(e.montant)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Bandeau « À ce jour » : plusieurs chiffres d'état, indépendants de la période choisie, sur une même ligne. */
export function BandeauStocks({ items }: { items: { label: string; value: string; tone?: string; hint?: string }[] }) {
  return (
    <div className="mt-4 rounded-xl bg-white/70 p-3 ring-1 ring-primary-100/60">
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">À ce jour</span>
      <dl className="mt-2 grid gap-4 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label} className="min-w-0">
            <dt className="text-xs text-slate-500">{i.label}</dt>
            <dd className={`truncate font-heading text-base font-bold ${i.tone ?? "text-slate-900"}`}>{i.value}</dd>
            {i.hint && <p className="text-[11px] leading-tight text-slate-400">{i.hint}</p>}
          </div>
        ))}
      </dl>
    </div>
  );
}

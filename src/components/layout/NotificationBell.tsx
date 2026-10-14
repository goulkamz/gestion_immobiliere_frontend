import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CheckCheck, FileText, Info } from "lucide-react";
import type { NotificationResponse, NotificationType } from "@/api/types";
import {
  useMarquerNotificationLueMutation,
  useMarquerToutesNotificationsLuesMutation,
  useNotificationCountQuery,
  useNotificationsQuery,
} from "@/hooks/queries/useNotifications";
import { formatDateTime } from "@/utils/format";

const TYPE_ICON: Record<NotificationType, typeof Info> = {
  INFO: Info,
  ECHEANCE: CalendarClock,
  DEMANDE: FileText,
};

/** Cloche de notifications in-app : compteur de non lues + panneau déroulant des plus récentes. Réservée aux utilisateurs connectés. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: count = 0 } = useNotificationCountQuery(true);
  const { data: page, isLoading } = useNotificationsQuery({ size: 10 }, open);
  const marquerLue = useMarquerNotificationLueMutation();
  const marquerToutesLues = useMarquerToutesNotificationsLuesMutation();

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleSelect(notification: NotificationResponse) {
    if (!notification.lue) marquerLue.mutate(notification.idNotification);
    setOpen(false);
    if (notification.lien) navigate(notification.lien);
  }

  const notifications = page?.content ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Notifications, ${count} non lue${count > 1 ? "s" : ""}` : "Notifications"}
        className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell size={20} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-[fade-up_0.15s_ease-out] overflow-hidden rounded-xl border border-primary-100/70 bg-white shadow-lg shadow-primary-900/10"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            <button
              type="button"
              onClick={() => marquerToutesLues.mutate()}
              disabled={count === 0 || marquerToutesLues.isPending}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 transition-colors hover:text-primary-900 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <CheckCheck size={14} aria-hidden="true" />
              Tout marquer comme lu
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Chargement...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune notification</p>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Info;
                  return (
                    <li key={n.idNotification}>
                      <button
                        type="button"
                        onClick={() => handleSelect(n)}
                        className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-primary-50 ${
                          n.lue ? "" : "bg-primary-50/50"
                        }`}
                      >
                        <Icon size={16} className={`mt-0.5 shrink-0 ${n.lue ? "text-slate-400" : "text-primary-600"}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${n.lue ? "text-slate-600" : "font-semibold text-slate-900"}`}>{n.titre}</span>
                          {n.message && <span className="mt-0.5 block text-xs text-slate-500">{n.message}</span>}
                          <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.dateCreation)}</span>
                        </span>
                        {!n.lue && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Non lue" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

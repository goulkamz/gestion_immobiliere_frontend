import React from "react";
import type { ReactNode } from "react";
import "./Notifications.scss";

// Interface pour une notification
interface Notification {
  type: "alert" | "ok" | "info" | string; // Type de notification
  duration?: number; // Durée en ms (optionnel)
  content?: string | ReactNode; // Contenu textuel ou JSX
  CustomComponent?: React.ComponentType; // Composant personnalisé (optionnel)
  [key: string]: any; // Pour d'autres propriétés
}

// Props pour le composant Notifications
interface NotificationsProps {
  notifications: Notification[];
}

// Props pour le composant Notif interne
interface NotifProps {
  content: string | ReactNode;
}

export default function Notifications({ notifications }: NotificationsProps) {
  // Composant interne Notif
  const Notif = ({ content }: NotifProps) => {
    return <>{content}</>;
  };

  return (
    <div id="Notifications">
      {notifications.map((notif, index) => {
        let className = "notification";

        // Gestion des classes CSS selon le type
        switch (notif.type) {
          case "alert":
            className += " notification--alert";
            break;
          case "ok":
            className += " notification--ok";
            break;
          case "info":
            className += " notification--info";
            break;
          default:
            className += " notification--default";
        }

        const duration = notif.duration ? notif.duration : 4000;

        return (
          <div
            className={className}
            style={{
              animation: `notif ${duration}ms ease-in-out forwards`,
            }}
            key={index}
          >
            {notif.CustomComponent ? <notif.CustomComponent /> : notif.content}
          </div>
        );
      })}
    </div>
  );
}

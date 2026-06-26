import "./DNavGroup.css";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Interface pour un élément de navigation
interface NavItem {
  path: string;
  name: string;
  icon: IconDefinition | null;
}

// Props pour le composant DNavGroup
interface DNavGroupProps {
  title: string;
  elmts: NavItem[];
}

export default function DNavGroup({ title, elmts }: DNavGroupProps) {
  return (
    <div className="DNavGroup">
      <hr />
      <div className="DNav__Title">{title}</div>
      {elmts.map((elmt, index) => (
        <NavLink
          key={index}
          className={({ isActive }) =>
            isActive ? "isActive DNav__Elmt" : "DNav__Elmt"
          }
          to={elmt.path}
        >
          {elmt.icon !== null && <FontAwesomeIcon icon={elmt.icon} />}
          {elmt.name}
        </NavLink>
      ))}
    </div>
  );
}

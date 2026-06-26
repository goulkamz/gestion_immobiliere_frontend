import React from "react";
import "./Logout.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import APIRoutes from "../../features/APIRest/APIRoutes";

// Interface pour les props
interface LogoutProps {
  style?: React.CSSProperties;
}

// Interface pour les données du formulaire (vide pour ce cas)
interface LogoutFormData {
  [key: string]: any;
}

export default function Logout({ style }: LogoutProps) {
  const { register, handleSubmit } = useForm<LogoutFormData>();
  const navigate = useNavigate();
  const [, , removeCookies] = useCookies(["user"]);

  function handleLogout(datas: LogoutFormData): void {
    APIRoutes.auth.logout.send(datas);
    removeCookies("user");
    navigate("/signin");
  }

  return (
    <>
      <button
        type="submit"
        form="Logout"
        className="logout"
        style={style}
        aria-label="Se déconnecter"
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="icon" />
      </button>
      <form
        style={{ display: "none" }}
        onSubmit={handleSubmit(handleLogout)}
        id="Logout"
      >
        {/* Champ caché si nécessaire */}
      </form>
    </>
  );
}

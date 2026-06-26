import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import APIRoutes from "../../../features/APIRest/APIRoutes";
import { isObjectEmpty } from "../../../features/utils";
import "./Partners.scss";
import "./agence.css";
import { useLocation } from "react-router-dom";

// Interface pour les données du formulaire (à compléter selon vos besoins)
interface AgencyFormData {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

// Interface pour les props (si nécessaire)
interface CreateAgencyProps {
  // Ajoutez vos props ici
}

export default function CreateAgency({}: CreateAgencyProps) {
  // Exemple d'utilisation des hooks importés (optionnel)
  // const { register, handleSubmit, formState: { errors } } = useForm<AgencyFormData>();
  // const location = useLocation();
  // const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //     // Votre logique ici
  // }, []);

  return (
    <>
      <h1>Bienvenue Agence</h1>
    </>
  );
}

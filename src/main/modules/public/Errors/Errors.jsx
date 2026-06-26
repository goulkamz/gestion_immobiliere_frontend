import React from "react";
import "./Errors.scss";
import Img from "../../../resources/images/Navigation-amico.svg";
import { Link } from "react-router-dom";

export default function Errors() {
  return (
    <section id="Errors">
      <div className="Errors__img">
        <img src={Img} alt="Phone Map" />
      </div>
      <div className="Errors__content">
        <h1>Uh-Oh, Seriez vous perdu ?!</h1>
        <h3>Erreur 404</h3>
        <p>
          La page à laquelle vous essayez d'accéder n'existe pas. <br /> Revenez
          en lieu sûr en{" "}
          <Link to={"/"} className="link">
            <span></span>cliquant ici !
          </Link>
        </p>
      </div>
    </section>
  );
}

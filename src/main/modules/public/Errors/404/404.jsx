import React from "react";
import "./404.scss";
import Img from "../../../../../resources/images/Navigation-amico.svg";
import { Link } from "react-router-dom";

export default function Errors404() {
  return (
    <section id="Errors404">
      <div className="Errors404__img">
        <img src={Img} alt="Phone Map" />
      </div>
      <div className="Errors404__content">
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

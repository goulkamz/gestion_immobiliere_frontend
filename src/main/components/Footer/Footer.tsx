import "./Footer.scss";
import logo from "../../../resources/images/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

interface FooterProps {
  // Ajoutez vos props ici si nécessaire
  email?: string;
  phone?: string;
  copyright?: string;
}

export default function Footer({
  email = "maasbf@maasbf.com",
  phone = "00-00-00-00 / 99-99-99-99",
  copyright = "© Copyright Maas-BF. Touts Droits Reserves",
}: FooterProps) {
  return (
    <footer>
      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>
      <div className="footer__contacts">
        <span>{email}</span>
        <span>{phone}</span>
      </div>
      <div className="footer__socials">
        <Link to="/whatsapp" className="link" aria-label="WhatsApp">
          <FontAwesomeIcon icon={faWhatsapp} className="icon" />
        </Link>
        <Link to="/facebook" className="link" aria-label="Facebook">
          <FontAwesomeIcon icon={faFacebook} className="icon" />
        </Link>
      </div>
      <span className="copyright">{copyright}</span>
    </footer>
  );
}

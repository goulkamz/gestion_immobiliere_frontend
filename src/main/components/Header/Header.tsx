import "./Header.scss";
import { NavLink, Link } from "react-router-dom";
import { isObjectEmpty } from "../../features/utils";
import modules from "../../modules/modules";
import { useSelector } from "react-redux";

// Définition du type pour l'utilisateur Redux
interface User {
  id?: string;
  username?: string;
  email?: string;
  roles?: string[];
  value?: any;
  [key: string]: any;
}

// Définition du type pour l'état Redux
interface RootState {
  user: {
    value: User;
  };
}

// Props pour le composant NavChild
interface NavChildProps {
  name: string;
  path: string;
  className?: string;
}

export default function Header() {
  const user = useSelector((state: RootState) => state.user.value);

  const NavChild = ({ name, path, className = "" }: NavChildProps) => {
    const finalClassName = " " + className;
    return (
      <NavLink
        className={({ isActive }) =>
          isActive
            ? "nav__isActive link" + finalClassName
            : "link" + finalClassName
        }
        to={path}
      >
        {name}
      </NavLink>
    );
  };

  return (
    <header>
      {/* <div className="header__logo">
        <img src={logo} alt="Logo" />
      </div> */}
      <nav>
        <div className="nav__menu">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="nav__toogle">
          <NavChild
            name={modules.public.routes.Home.name}
            path={modules.public.routes.Home.path}
          />
          <NavChild
            name={modules.public.routes.Carte.name}
            path={modules.public.routes.Carte.path}
          />
          <NavChild
            name={modules.public.routes.Book.name}
            path={modules.public.routes.Book.path}
          />
          <NavChild
            name={modules.public.routes.Service.name}
            path={modules.public.routes.Service.path}
          />
          <NavChild
            name={modules.public.routes.Location.name}
            path={modules.public.routes.Location.path}
          />
          <NavChild
            name={modules.public.routes.Offers.name}
            path={modules.public.routes.Offers.path}
          />

          <div className="header__about">A propos</div>
          <form action=""></form>
          {isObjectEmpty(user) ? (
            <NavChild
              name={"Connexion"}
              path={modules.auth.routes.Signin.path}
            />
          ) : (
            "Déconnexion"
          )}
          <Link to={modules.client.routes.Profil.path} className="link">
            profil
          </Link>
        </div>
      </nav>
    </header>
  );
}

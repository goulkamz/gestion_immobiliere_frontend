import { setRoute } from "../modules";
import type { RoutesObject } from "../modules";
import Login from "./Login/Login";
import Register from "./Register/Register";

const routes: RoutesObject = {
  Signin: setRoute("/signin", "Connexion", Login),
  Signup: setRoute("/signup", "Inscription", Register),
};

export default routes;

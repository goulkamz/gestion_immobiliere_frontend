import { setRoute } from "../modules";
import type { RoutesObject } from "../modules";
import Profil from "./Profil/Profil";

const routes: RoutesObject = {
  // Set this to false because the header checks all visible routes and displays them. However, we have no control over the order,
  // and the profile page needs to be at the end. So we set it to false and manually add the profile route to the header.
  Profil: setRoute("/profil", "Profil", Profil),
};

export default routes;

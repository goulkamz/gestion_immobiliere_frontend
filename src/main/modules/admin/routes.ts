import { setRoute } from "../modules";
import type { RoutesObject } from "../modules";
import Dashboard from "./Dashboard/Dashboard";
import Partners from "./Partners/Partners";
import Agencies from "./Partners/Agencies";

const routes: RoutesObject = {
  Dashboard: setRoute("/", "Dashboard", Dashboard),
  Partners: setRoute("/partners", "Partenaires", Partners),
  Agencies: setRoute("/agencies", "Agences", Agencies),
};

export default routes;

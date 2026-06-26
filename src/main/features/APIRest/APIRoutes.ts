// import AdminRoutes from "./AdminRoutes";
import AuthRoutes from "./AuthRoutes";
// import ClientRoutes from "./ClientRoutes";
// import Overpassapi from "./OverpassAPI";
// import PartnerRoutes from "./PartnerRoutes";

type APIRoutes = {
  auth: typeof AuthRoutes;
  // admin: typeof AdminRoutes;
  // partner: typeof PartnerRoutes;
  // client: typeof ClientRoutes;
  // overpassapi: typeof Overpassapi;
};

const APIRoutes: APIRoutes = {
  auth: AuthRoutes,
  // admin: AdminRoutes,
  // partner: PartnerRoutes,
  // client: ClientRoutes,
  // overpassapi: Overpassapi
};

export default APIRoutes;
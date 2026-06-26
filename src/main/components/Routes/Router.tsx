import { useCookies } from "react-cookie";
import modules from "../../modules/modules";
import { isObjectEmpty } from "../../features/utils";
import RouteComponents from "./RouteComponents";

export default function Router() {
  const [cookies] = useCookies(["user"]);

  const user = cookies?.user ? cookies?.user : {};

  console.log(user);

  // Will contain all routes for this user
  let userRoutes = { ...modules.public.routes };

  if (!isObjectEmpty(user)) {
    //if (Object.keys(user).length !== 0 && Array.isArray(user.roles)) {

    if (user.roles.includes(modules.client.name)) {
      userRoutes = { ...modules.public.routes, ...modules.client.routes };
    }
    if (user.roles.includes(modules.admin.name)) {
      userRoutes = { ...modules.admin.routes };
    }
  }

  return <RouteComponents routes={{ ...userRoutes, ...modules.auth.routes }} />;
}

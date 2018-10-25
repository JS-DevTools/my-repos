import { params } from "../params";
import { EditDashboardDialog } from "./edit-dashboard/dialog";


export function App() {
  if (params.isNew) {
    return <EditDashboardDialog />;
  }
  else {
    return <main>Hello, world</main>;
  }
}

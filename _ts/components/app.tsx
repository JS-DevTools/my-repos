import { params } from "../params";
import { EditDashboardModal } from "./edit-dashboard/modal";


export function App() {
  if (params.isNew) {
    return <EditDashboardModal />;
  }
  else {
    return <div>Hello, world</div>;
  }
}

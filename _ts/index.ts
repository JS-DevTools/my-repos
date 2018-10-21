import { editDashboardDialog } from "./edit-dashboard-dialog";
import { params } from "./params";

if (params.isNew) {
  editDashboardDialog.showModal();
}

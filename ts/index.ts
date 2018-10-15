import { dialog } from "./dialog";
import { params } from "./params";

if (params.isEmpty) {
  dialog.showModal();
}

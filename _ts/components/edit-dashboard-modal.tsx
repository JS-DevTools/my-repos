import { params } from "../params";
import { EditDashboardForm } from "./edit-dashboard-form";


export function EditDashboardModal() {
  return (
    <div className="dialog-container">
      <dialog open className="open">
        <header className="dialog-header">
          <img className="logo" src="img/logo.png" alt="logo image" />
          <h1>GitHub Repo Health</h1>
          <h2>See the health of all your GitHub repos on one page</h2>
        </header>
        <div className="dialog-body">
          <h3>{getTitle()}</h3>
          <EditDashboardForm />
        </div>

        <footer className="dialog-footer">
          <button type="button" disabled className="btn">Cancel</button>
          <button type="button" disabled className="btn btn-primary">Create My Dashboard</button>
        </footer>
      </dialog>

      <div className="backdrop"></div>
    </div>
  );
}


function getTitle(): string {
  if (params.isNew) {
    return "Hi! 👋 Enter your GitHub username below to get started";
  }
  else {
    return "Edit Your Dashboard";
  }
}

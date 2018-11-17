import { MouseEvent } from "react";
import { stateStore } from "../state-store";

export function Options() {
  let { accounts, showForks, showArchived } = stateStore.state;
  let hasForks = false, hasArchived = false;

  for (let account of accounts) {
    for (let repo of account.repos) {
      hasForks = hasForks || repo.fork;
      hasArchived = hasArchived || repo.archived;
    }
  }

  if (!hasForks && !hasArchived) {
    return null;  // tslint:disable-line:no-null-keyword
  }

  return (
    <div className="responsive-container">
      <aside id="options">
        {
          hasForks &&
          <a id="toggle_forks" href={`#forks=${showForks ? "hide" : "show"}`} onClick={handleOptionClick}>
            {showForks ? "hide" : "show"} forks
          </a>
        }
        {
          hasArchived &&
          <a id="toggle_archived" href={`#archived=${showArchived ? "hide" : "show"}`} onClick={handleOptionClick}>
            {showArchived ? "hide" : "show"} archived
          </a>
        }
      </aside>
    </div>
  );
}


function handleOptionClick(event: MouseEvent) {
  event.preventDefault();

  switch (event.currentTarget.id) {
    case "toggle_forks":
      stateStore.setState({ showForks: !stateStore.state.showForks });
      break;

    case "toggle_archived":
      stateStore.setState({ showArchived: !stateStore.state.showArchived });
      break;
  }
}

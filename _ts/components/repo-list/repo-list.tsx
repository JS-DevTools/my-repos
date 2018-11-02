// import { GitHubAccount, GitHubRepo } from "../../github";
// import { Props } from "../account-list/props";

// interface RepoListProps extends Props {
//   account: GitHubAccount;
// }

// export function RepoList(props: RepoListProps) {
//   let { account, selectedAccount } = props;

//   return (
//     <section className={account === selectedAccount ? "repo-list-container selected" : "repo-list-container"}>
//       <header>
//         <h3 className="account-name">
//           {account.avatar_url && <img src={account.avatar_url} className="avatar" />}
//           {account.name}
//         </h3>
//       </header>
//       <RepoListContents {...props} />
//     </section>
//   );
// }

// function RepoListContents(props: RepoListProps) {
//   let { account } = props;

//   if (account.repos.length > 0) {
//     return (
//       <ul className="repo-list">
//         {account.repos.map((repo) => <RepoItem repo={repo} {...props} />)}
//       </ul>
//     );
//   }
//   else if (account.error) {
//     return (
//       <div className="repo-list error">
//         <div className="error-message">{account.error}</div>
//       </div>
//     );
//   }
//   else {
//     return (
//       <div className="repo-list loading">
//         <div className="loading-message">Loading...</div>
//       </div>
//     );
//   }
// }

// interface RepoItemProps extends RepoListProps {
//   repo: GitHubRepo;
// }

// class RepoItem extends React.Component<RepoItemProps, object> {
//   public render() {
//     let { repo } = this.props;

//     return (
//       <li key={repo.id} className="repo">
//         {repo.name}
//       </li>
//     );
//   }
// }

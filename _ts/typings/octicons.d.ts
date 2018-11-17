declare module "octicons" {
  let octicons: octicons.Octicons;
  export = octicons;

  namespace octicons {
    /**
     * The name of an Octicons icon
     */
    type OcticonName =
      "plus" | "primitive-dot" | "primitive-square" | "quote" | "three-bars" | "triangle-down" |
      "triangle-left" | "triangle-right" | "triangle-up" | "kebab-horizontal" | "kebab-vertical" |
      "screen-full" | "screen-normal" | "x" | "grabber" | "plus-small" | "pulse" | "star" | "stop" |
      "sync" | "text-size" | "report" | "link-external" | "checklist" | "cloud-download" |
      "cloud-upload" | "fold" | "tasklist" | "history" | "dash" | "list-ordered" | "list-unordered" |
      "reply" | "mute" | "comment-discussion" | "comment" | "ellipsis" | "heart" | "horizontal-rule" |
      "info" | "italic" | "unverified" | "verified" | "question" | "unfold" | "sign-in" | "sign-out" |
      "alert" | "arrow-down" | "arrow-left" | "arrow-right" | "arrow-up" | "arrow-both" |
      "arrow-small-down" | "arrow-small-left" | "arrow-small-right" | "arrow-small-up" | "check" |
      "chevron-down" | "chevron-left" | "chevron-right" | "chevron-up" | "circle-slash" | "bold" |
      "mention" | "beaker" | "bell" | "briefcase" | "credit-card" | "device-camera-video" |
      "device-camera" | "device-desktop" | "device-mobile" | "gift" | "gear" | "book" | "tag" |
      "telescope" | "tools" | "trashcan" | "unmute" | "watch" | "key" | "archive" | "light-bulb" |
      "link" | "location" | "lock" | "mail-read" | "mail" | "megaphone" | "bookmark" | "calendar" |
      "clippy" | "clock" | "desktop-download" | "globe" | "home" | "inbox" | "law" | "milestone" |
      "mortar-board" | "package" | "pencil" | "pin" | "plug" | "rocket" | "search" | "note" |
      "shield" | "dashboard" | "graph" | "settings" | "project" | "play" | "github-action" | "code" |
      "git-branch" | "diff-added" | "diff-ignored" | "diff-modified" | "diff-removed" |
      "diff-renamed" | "diff" | "circuit-board" | "gist" | "git-commit" | "git-compare" | "git-merge" |
      "git-pull-request" | "issue-closed" | "issue-opened" | "issue-reopened" | "database" |
      "no-newline" | "broadcast" | "keyboard" | "file-binary" | "file-code" | "file-directory" |
      "file-media" | "file-pdf" | "file-submodule" | "file-symlink-directory" | "file-symlink-file" |
      "file-zip" | "browser" | "file" | "repo-clone" | "repo-force-push" | "repo-forked" |
      "repo-pull" | "repo-push" | "repo" | "mirror" | "ruby" | "server" | "terminal" | "radio-tower" |
      "rss" | "versions" | "squirrel" | "zap" | "flame" | "bug" | "person" | "smiley" | "hubot" |
      "thumbsdown" | "thumbsup" | "organization" | "gist-secret" | "eye" | "eye-closed" | "jersey" |
      "octoface" | "mark-github" | "logo-github" | "logo-gist" | "markdown" | "paintcan";

    /**
     * A map of every Octicon name to its definition
     */
    type Octicons = {
      [key in OcticonName]: Octicon;
    }

    /**
     * The definition of a single Octicon icon
     */
    interface Octicon {
      /**
       * The icon name, same as the key for the icon
       */
      name: string;

      /**
       * The symbol name, same as the key for the icon
       */
      symbol: string;

      /**
       * An array of keywords and aliases for the icon
       */
      keywords: string[];

      /**
       * The icon's true width, based on the svg view box width
       */
      width: number;

      /**
       * The icon's true height, based on the svg view box height
       */
      height: number;

      /**
       * The icon's SVG path (e.g. "<path fill-rule="evenodd" d="M12 9H7v5H5V9H0V7h5V2h2v5h5v2z"/>")
       */
      path: string;

      /**
       * Attributes that will be added to the output tag by the `toSVG()` method
       */
      options: {
        /**
         * The SVG version number (e.g. "1.1")
         */
        version: string;

        /**
         * The SVG width attribute (same as in the viewbox)
         */
        width: number;

        /**
         * The SVG height attribute (same as in the viewbox)
         */
        height: number;

        /**
         * The SVG viewbox attribute (e.g. "0 0 12 16")
         */
        viewBox: string;

        /**
         * The CSS class names (e.g. "octicon octicon-plus")
         */
        class: string;

        /**
         * The string "true"
         */
        'aria-hidden': string;
      };

      /**
       * Returns the icon's complete <svg> tag
       */
      toSVG: () => string;

      /**
       * ????
       */
      figma: {
        id: string;
        file: string;
      };
    }
  }
}

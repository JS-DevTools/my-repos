process.env.NODE_ENV = "production";

import config from "./rollup.config.dev";
import manifest from "./package.json";
import { terser } from "rollup-plugin-terser";

config.output.banner =
`/*!
 * ${manifest.name} v${manifest.version} (${new Date().toDateString()})
 *
 * ${manifest.homepage}
 *
 * @author  ${manifest.author.name} (${manifest.author.url})
 * @license ${manifest.license}
 */`;

 config.plugins.push(terser({
   ecma: 8,
   output: {
    comments: /^!/,
   },
 }));

export default config;

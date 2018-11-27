import { createConfig } from "./rollup.config";
import manifest from "./package.json";

const banner =
`/*!
 * ${manifest.name} v${manifest.version} (${new Date().toDateString()})
 *
 * ${manifest.homepage}
 *
 * @author  ${manifest.author.name} (${manifest.author.url})
 * @license ${manifest.license}
 */`;

export default createConfig({ env: "production", banner, minify: true });

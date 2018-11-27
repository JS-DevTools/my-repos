import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";

export default {
  input: "_ts/index.tsx",

  output: {
    file: "js/my-repos.js",
    format: "iife",
    sourcemap: true,
  },

  plugins: [
    nodeResolve(),
    commonjs({
      namedExports: {
        "node_modules/react/index.js": ["createElement", "Component"],
        "node_modules/react-dom/index.js": ["render"],
      }
    }),
    json(),
    typescript(),
  ],
};

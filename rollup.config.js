import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";

export function createConfig({ env, banner, minify }) {
  process.env.NODE_ENV = env = env || process.env.NODE_ENV || "development";

  let config = {
    input: "_ts/index.tsx",

    output: {
      file: "js/my-repos.js",
      format: "iife",
      sourcemap: true,
      banner,
    },

    plugins: [
      nodeResolve(),
      commonjs({
        namedExports: {
          "node_modules/react/index.js": ["createElement", "Component"],
          "node_modules/react-dom/index.js": ["render"],
        }
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify(env),
      }),
      json(),
      typescript(),
    ],
  };

  if (minify) {
    config.plugins.push(
      terser({
        ecma: 8,
        output: {
          comments: /^!/,
        },
      })
    );
  }

  return config;
}

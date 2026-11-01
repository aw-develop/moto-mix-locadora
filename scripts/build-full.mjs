import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
function run(args) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["node_modules/typescript/bin/tsc", "-p", "tsconfig.server.json"]);
run([
  "node_modules/@angular/cli/bin/ng.js",
  "build",
  "--configuration",
  "production",
  "--deploy-url",
  "/client/",
]);
rmSync("public/client", { force: true, recursive: true });
mkdirSync("public/client", { recursive: true });
cpSync(".angular/site-client", "public/client", { recursive: true });
writeFileSync(
  "app/angular-shell.html",
  readFileSync(".angular/site-client/index.html"),
);
run(["scripts/run-framework.mjs", "build"]);

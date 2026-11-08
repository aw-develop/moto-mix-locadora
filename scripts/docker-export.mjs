import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(process.argv[2] ?? "/artifacts");
const sourceRelativeToOutput = relative(output, root);
if (
  !sourceRelativeToOutput.startsWith("..") &&
  !isAbsolute(sourceRelativeToOutput)
) {
  throw new Error(
    "O diretório de artefatos não pode ser a raiz do projeto ou um diretório acima dela.",
  );
}

for (const file of [
  "dist/server/index.js",
  "dist/server/wrangler.json",
  "dist/client",
  "drizzle/meta/_journal.json",
]) {
  if (!existsSync(join(root, file)))
    throw new Error(`Build incompleto: ${file}. Execute npm run build.`);
}

mkdirSync(output, { recursive: true });
// These are generated artifacts, never production data or the source checkout.
for (const folder of ["dist", "drizzle"]) {
  rmSync(join(output, folder), { recursive: true, force: true });
  cpSync(join(root, folder), join(output, folder), { recursive: true });
}
// The generated build config uses the builder's absolute migration path.
// Export a relative path so host-side Wrangler can also find these SQL files.
const configPath = join(output, "dist/server/wrangler.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
config.d1_databases = (config.d1_databases ?? []).map((database) => ({
  ...database,
  ...(database.binding === "DB" ? { migrations_dir: "../../drizzle" } : {}),
}));
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
cpSync(join(root, "docs/DOCKER.md"), join(output, "LEIA-ME.md"));
console.log(
  `Artefatos exportados em ${output}. A publicação e as migrações no ambiente remoto são etapas separadas.`,
);

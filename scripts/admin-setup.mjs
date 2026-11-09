import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createAdminSecrets } from "./admin-credentials.mjs";

const configPath = fileURLToPath(
  new URL("../dist/server/wrangler.json", import.meta.url),
);
const wrangler = fileURLToPath(
  new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
);
const expectedAccount = "825f844ee27d60a88ad9a5ed44568ed8";
function run(args, input, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], {
      stdio: ["pipe", capture ? "pipe" : "inherit", "inherit"],
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_WRITE_LOGS: "false",
      },
    });
    let output = "";
    if (capture)
      child.stdout.setEncoding("utf8").on("data", (part) => (output += part));
    child.once("error", () =>
      reject(new Error("Não foi possível iniciar o Wrangler.")),
    );
    child.once("close", (code) =>
      code === 0
        ? resolve(output)
        : reject(
            new Error(
              "O Wrangler não concluiu a operação. Confira o acesso à conta e o Worker.",
            ),
          ),
    );
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
try {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Execute em um terminal interativo no seu computador. A senha não deve vir de argumentos ou pipes.",
    );
  if (!existsSync(configPath))
    throw new Error("Execute npm run build antes de configurar os segredos.");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  if (
    config.account_id !== expectedAccount ||
    config.name !== "mix-locadora-angular" ||
    config.d1_databases?.find((db) => db.binding === "DB")?.database_id !==
      "cac76df3-554e-4b84-9b34-d07496268924"
  ) {
    throw new Error(
      "A configuração gerada não corresponde ao Worker e D1 de produção esperados. Atualize o projeto e gere o build.",
    );
  }
  const result = JSON.parse(
    await run(
      [
        "d1",
        "execute",
        "bd_moto-mixlocadora",
        "--remote",
        "--config",
        configPath,
        "--json",
        "--command",
        "SELECT count(*) AS total FROM admin_credentials",
      ],
      undefined,
      true,
    ),
  );
  if (!Array.isArray(result) || result[0]?.results?.[0]?.total !== 0) {
    throw new Error(
      "O banco já tem uma conta ou não confirmou o estado vazio. Use Segurança de acesso no painel; este assistente é somente para a primeira configuração.",
    );
  }
  let hidden = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hidden) process.stdout.write(chunk);
      callback();
    },
  });
  const prompt = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  const askSecret = async (label) => {
    process.stdout.write(label);
    hidden = true;
    try {
      return await prompt.question("", { signal: abort.signal });
    } finally {
      hidden = false;
      process.stdout.write("\n");
    }
  };
  const abort = new AbortController();
  const interrupted = () => abort.abort();
  prompt.on("SIGINT", interrupted);
  let payload;
  try {
    const username =
      (
        await prompt.question("Login inicial [admin]: ", {
          signal: abort.signal,
        })
      ).trim() || "admin";
    let password = await askSecret(
      "Senha inicial (16–128 caracteres, oculta): ",
    );
    let confirmation = await askSecret("Confirme a senha (oculta): ");
    payload = createAdminSecrets(username, password, confirmation);
    password = confirmation = "";
  } finally {
    prompt.off("SIGINT", interrupted);
    prompt.close();
  }
  console.log(
    "Enviando somente o login, o hash e a chave de sessão para o Worker de produção.",
  );
  await run(
    ["secret", "bulk", "--config", configPath],
    JSON.stringify(payload),
  );
  payload = undefined;
  console.log(
    "Segredos enviados. A senha não foi gravada em arquivo nem incluída nos argumentos do processo. Publique o build preparado para usar o novo login.",
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Não foi possível configurar os segredos.",
  );
  process.exitCode = 1;
}

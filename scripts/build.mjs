import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const deployableEntries = ["index.html", "styles.css", "app.js", ".nojekyll", "assets"];

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });

for (const entry of deployableEntries) {
  await cp(path.join(root, entry), path.join(output, entry), {
    force: true,
    recursive: true,
  });
}

console.log(`Site prêt à déployer dans ${path.relative(root, output)}.`);

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const localReferences = new Set();

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function collectReference(rawReference) {
  const reference = rawReference.trim();
  if (
    !reference ||
    /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference) ||
    reference.includes("${")
  ) {
    return;
  }

  const withoutQuery = reference.split(/[?#]/, 1)[0];
  if (withoutQuery) localReferences.add(withoutQuery);
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const html = await readFile(path.join(root, "index.html"), "utf8");
const css = await readFile(path.join(root, "styles.css"), "utf8");
const javascript = await readFile(path.join(root, "app.js"), "utf8");

assert(/^\s*<!doctype html>/i.test(html), "index.html doit déclarer un doctype HTML.");
assert(/<html\b[^>]*\blang=(['"])fr\1/i.test(html), "La langue principale doit être définie sur fr.");
assert(/<meta\b[^>]*\bname=(['"])viewport\1/i.test(html), "La balise viewport est absente.");
assert(/<title>[^<]+<\/title>/i.test(html), "Le titre de la page est absent ou vide.");
assert(/<link\b[^>]*\bhref=(['"])styles\.css\1/i.test(html), "styles.css n'est pas chargé par index.html.");
assert(/<script\b[^>]*\bsrc=(['"])app\.js\1/i.test(html), "app.js n'est pas chargé par index.html.");
assert(/<\/html>\s*$/i.test(html), "La balise html fermante est absente.");

const ids = [...html.matchAll(/\bid\s*=\s*(['"])([^'"]+)\1/gi)].map((match) => match[2]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicateIds.length === 0, `Identifiants HTML dupliqués : ${duplicateIds.join(", ")}`);

for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(['"])(.*?)\1/gi)) {
  collectReference(match[2]);
}
for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
  collectReference(match[2]);
}
for (const match of javascript.matchAll(/(['"`])(assets\/[^'"`?#]+)\1/g)) {
  collectReference(match[2]);
}

for (const reference of [...localReferences].sort()) {
  let decodedReference;
  try {
    decodedReference = decodeURIComponent(reference);
  } catch {
    failures.push(`Référence locale invalide : ${reference}`);
    continue;
  }

  const absolutePath = path.resolve(root, decodedReference.replace(/^\/+/, ""));
  const relativePath = path.relative(root, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    failures.push(`Référence locale hors du projet : ${reference}`);
  } else if (!(await fileExists(absolutePath))) {
    failures.push(`Ressource locale introuvable : ${reference}`);
  }
}

if (failures.length > 0) {
  console.error("Échec des contrôles statiques :");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Contrôles statiques réussis (${localReferences.size} ressources locales vérifiées).`);
}

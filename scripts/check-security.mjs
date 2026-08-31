import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const [html,javascript,securitySource]=await Promise.all([
  readFile(path.join(root,"index.html"),"utf8"),
  readFile(path.join(root,"app.js"),"utf8"),
  readFile(path.join(root,"room-security.js"),"utf8")
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message)};

const context=vm.createContext({TextEncoder,Uint32Array,JSON,Object,Set,Map,Date,Math,console});
vm.runInContext(securitySource,context,{filename:"room-security.js"});
const security=context.RoomSecurity;

assert(security&&security.ROOM_CODE_LENGTH===10,"Les codes de room doivent contenir 10 caractères.");
assert(security.normalizeRoomCode("ab-cd!23456789")==="ABCD234567","La normalisation du code de room est incorrecte.");
const generated=security.randomRoomCode({getRandomValues(buffer){for(let index=0;index<buffer.length;index++)buffer[index]=index;return buffer}});
assert(generated.length===10&&/^[A-Z2-9]+$/.test(generated),"La génération du code de room est invalide.");
assert(security.messageSizeIsSafe({type:"ok",value:"x".repeat(1000)}),"Un message normal est rejeté.");
assert(!security.messageSizeIsSafe({type:"large",value:"x".repeat(70*1024)}),"Un message surdimensionné doit être rejeté.");
const cyclic={};cyclic.self=cyclic;assert(!security.messageSizeIsSafe(cyclic),"Un message cyclique doit être rejeté.");
const limiter=security.createRateLimiter({windowMs:1000,maxMessages:2});
assert(limiter.accept("peer",0)&&limiter.accept("peer",1)&&!limiter.accept("peer",2)&&limiter.accept("peer",1000),"La limitation de fréquence est incorrecte.");

assert(!javascript.includes("resultHtml"),"La room ne doit jamais synchroniser de HTML de résultat.");
assert(!/\.innerHTML\s*=\s*state\./.test(javascript),"Un état distant est encore injecté avec innerHTML.");
assert(javascript.includes("possessedRoundResult.textContent=possessedRoundSummary"),"Le résumé du Possédé doit être rendu comme texte.");
assert(javascript.includes('data.type==="challenge-state-proposal"'),"Les propositions invitées doivent être séparées des snapshots hôte.");
assert(javascript.includes("normalizeRoomChallengeMessage"),"Les messages de défi doivent être normalisés.");
assert(!/length\s*===\s*5/.test(javascript)&&javascript.includes("length===ROOM_CODE_LENGTH"),"Les liens d’invitation doivent utiliser la longueur de code renforcée.");
assert(javascript.includes("normalized.challenge===currentRoomChallenge"),"L’hôte ne doit accepter que l’état du défi actif.");
assert(!/\son[a-z]+\s*=\s*["']/.test(`${html}\n${javascript}`),"Les gestionnaires d’évènements inline sont interdits par la CSP.");
assert(/Content-Security-Policy/i.test(html)&&/script-src-attr 'none'/.test(html),"La CSP stricte est absente.");

if(failures.length){
  console.error("Échec des contrôles de sécurité :");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exitCode=1
}else console.log("Contrôles de sécurité réussis.");

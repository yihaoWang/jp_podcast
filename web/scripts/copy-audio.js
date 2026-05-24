import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(process.cwd(), "../audio");
const dest = resolve(process.cwd(), "public/audio");

if (!statSync(src).isDirectory()) {
  throw new Error(`Expected audio source folder at ${src}`);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

const copyRecursive = (srcDir, destDir) => {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const from = resolve(srcDir, entry.name);
    const to = resolve(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(to, { recursive: true });
      copyRecursive(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
    }
  }
};

copyRecursive(src, dest);
console.log(`Copied audio files from ${src} to ${dest}`);

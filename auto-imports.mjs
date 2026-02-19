#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, relative, dirname, resolve, basename } from "node:path";
import { watch } from "node:fs";

const args = process.argv;
const srcIdx = args.indexOf("--src");
const src = srcIdx > -1 && args[srcIdx + 1] ? args[srcIdx + 1] : "src";
const outIdx = args.indexOf("--out");
const gFile = outIdx > -1 && args[outIdx + 1] ? args[outIdx + 1] : join(src, "global.js");

const srcAbs = resolve(src);
const gFileAbs = resolve(gFile);
const outDir = dirname(gFileAbs);
const outBase = basename(gFileAbs);

const YEL = "\x1b[1;33m";
const BLD = "\x1b[1m";
const RST = "\x1b[0m";

const walk = async (dir) => {
	try {
		const dns = await readdir(dir, { withFileTypes: true });
		const f = await Promise.all(dns.map(d => {
			if (d.name === "node_modules" || d.name.startsWith(".")) return [];
			const p = join(dir, d.name);
			return d.isDirectory() ? walk(p) : resolve(p);
		}));
		return f.flat();
	} catch { return []; }
};

const getName = (code) => {
	const clean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
	const m = clean.match(/export\s+default\s+(?:function\s+|class\s+)?([A-Za-z_$][A-Za-z0-9_$]*)/);
	return m && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(m[1]) ? m[1] : null;
};

const write = async (f, c) => {
	try { if (await readFile(f, "utf8") === c) return; } catch { }
	await mkdir(dirname(f), { recursive: true });
	await writeFile(f, c);
};

const run = async () => {
	console.clear();
	try {
		await stat(srcAbs);
	} catch {
		console.log(`${YEL}Source directory "${src}" not found. Use --src <dir> to change.${RST}\n`);
		return;
	}

	const all = await walk(srcAbs);
	const files = all.filter(f => f !== gFileAbs && /\.[jt]sx?$/.test(f));

	if (files.length === 0) {
		console.log(`${YEL}0 files found in "${src}".${RST}\n`);
		return;
	}

	const seen = new Map();
	let out = "";

	for (const f of files) {
		let code;
		try { code = await readFile(f, "utf8"); } catch { continue; }
		const name = getName(code);
		if (!name) continue;

		if (name in globalThis) {
			console.error(`${YEL}Warning: Invalid name "${name}" (reserved) in ${f}${RST}`);
			continue;
		}

		if (seen.has(name)) {
			console.error(`${YEL}Warning: Collision "${name}"\n\t${f}\n\t${seen.get(name)}${RST}`);
			continue;
		}

		seen.set(name, f);
		const rel = relative(outDir, f).replace(/\\/g, "/").replace(/\.[jt]sx?$/, "");
		const req = rel.startsWith(".") ? rel : `./${rel}`;
		out += `import ${name} from "${req}";\nglobalThis.${name} = ${name};\n\n`;
	}

	await write(gFileAbs, out);
	const time = new Date().toLocaleTimeString("en-US", { hour12: true });
	console.log(`${BLD}✅ AutoImport completed [${time}]${RST}\n`);
};

(async () => {
	await run();
	if (args.includes("--watch")) {
		let t;
		watch(srcAbs, { recursive: true }, (_, f) => {
			if (!f || !/\.[jt]sx?$/.test(f) || f.includes("node_modules") || f.includes(outBase)) return;
			clearTimeout(t);
			t = setTimeout(run, 150);
		});
	}
})();
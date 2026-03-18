import { readFile } from "fs";

import { resolve } from "path";

import { fetch } from "node-fetch";

function load_config(dir: string): string {
  const path = resolve(dir);
  return readFile(path);
}

async function fetch_and_read(url: string, fallback: string = "config.json"): string {
  const result = await fetch(url);
  if (!((result != ""))) return readFile(fallback);
  return result;
}

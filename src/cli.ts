#!/usr/bin/env node

/**
 * ClarityLang CLI
 *
 * Usage:
 *   clarity compile <file.clarity>          # Transpile to TypeScript
 *   clarity compile <file.clarity> -o out.ts # Specify output
 *   clarity check <file.clarity>            # Type-check only
 *   clarity fmt <file.clarity>              # Format source
 */

import { readFileSync, writeFileSync } from "fs";
import { Lexer } from "./lexer/lexer.js";
import { Parser, ParseError } from "./parser/parser.js";
import { TypeChecker } from "./typechecker/typechecker.js";
import { TypeScriptEmitter } from "./emitter/typescript.js";
import { formatDiagnostic, type Diagnostic } from "./diagnostics/reporter.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
ClarityLang v0.1.0

Usage:
  clarity compile <file.clarity>    Transpile to TypeScript
  clarity check <file.clarity>      Type-check only
  clarity fmt <file.clarity>        Format source
  `);
  process.exit(0);
}

const file = args[1];
if (!file) {
  console.error(`Error: No input file specified.`);
  process.exit(1);
}

function compile(sourcePath: string): string {
  const source = readFileSync(sourcePath, "utf-8");
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  let ast;
  try {
    const parser = new Parser(tokens);
    ast = parser.parse();
  } catch (err) {
    if (err instanceof ParseError) {
      const diagnostic: Diagnostic = {
        message: err.message.replace(/^Parse error at \d+:\d+: /, ""),
        position: err.position,
        severity: "error",
      };
      throw new DiagnosticError(formatDiagnostic(source, diagnostic));
    }
    throw err;
  }

  const checker = new TypeChecker();
  const typeErrors = checker.check(ast);
  if (typeErrors.length > 0) {
    const diagnostics: Diagnostic[] = typeErrors.map((e) => ({
      message: e.message,
      position: e.position,
      severity: "error" as const,
      suggestion: e.suggestion,
    }));
    const formatted = diagnostics
      .map((d) => formatDiagnostic(source, d))
      .join("\n\n");
    throw new DiagnosticError(formatted);
  }

  const emitter = new TypeScriptEmitter();
  return emitter.emit(ast);
}

class DiagnosticError extends Error {
  constructor(formatted: string) {
    super(formatted);
    this.name = "DiagnosticError";
  }
}

switch (command) {
  case "compile": {
    try {
      const output = compile(file);
      const outputFlag = args.indexOf("-o");
      if (outputFlag !== -1 && args[outputFlag + 1]) {
        writeFileSync(args[outputFlag + 1], output);
        console.log(`Compiled ${file} → ${args[outputFlag + 1]}`);
      } else {
        const outPath = file.replace(/\.clarity$/, ".ts");
        writeFileSync(outPath, output);
        console.log(`Compiled ${file} → ${outPath}`);
      }
    } catch (err) {
      if (err instanceof DiagnosticError) {
        console.error(err.message);
      } else {
        console.error(`Compile error: ${(err as Error).message}`);
      }
      process.exit(1);
    }
    break;
  }

  case "check": {
    try {
      compile(file);
      console.log(`${file}: OK`);
    } catch (err) {
      if (err instanceof DiagnosticError) {
        console.error(err.message);
      } else {
        console.error(`Check failed: ${(err as Error).message}`);
      }
      process.exit(1);
    }
    break;
  }

  case "fmt": {
    console.log("Formatter not yet implemented.");
    break;
  }

  default: {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

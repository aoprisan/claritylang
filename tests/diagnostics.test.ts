import { describe, it, expect } from "vitest";
import {
  formatDiagnostic,
  formatDiagnostics,
  suggest,
  levenshtein,
  type Diagnostic,
} from "../src/diagnostics/reporter.js";
import { Lexer } from "../src/lexer/lexer.js";
import { Parser, ParseError } from "../src/parser/parser.js";
import { TypeChecker } from "../src/typechecker/typechecker.js";

function parse(source: string) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

function check(source: string) {
  const ast = parse(source);
  const checker = new TypeChecker();
  return checker.check(ast);
}

// ─── Unit: levenshtein ───

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("returns the length of the other string when one is empty", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("computes single-character edits", () => {
    expect(levenshtein("cat", "car")).toBe(1); // substitution
    expect(levenshtein("cat", "cats")).toBe(1); // insertion
    expect(levenshtein("cats", "cat")).toBe(1); // deletion
  });

  it("handles transpositions as two edits", () => {
    expect(levenshtein("ab", "ba")).toBe(2);
  });

  it("computes multi-edit distances", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

// ─── Unit: suggest ───

describe("suggest", () => {
  const types = ["Text", "Number", "Boolean", "Void", "Duration", "Date", "Timestamp"];

  it("suggests a close match", () => {
    expect(suggest("Numbr", types)).toBe("Number");
    expect(suggest("Tex", types)).toBe("Text");
    expect(suggest("Boolan", types)).toBe("Boolean");
  });

  it("returns undefined when nothing is close", () => {
    expect(suggest("CompletelyWrong", types)).toBeUndefined();
  });

  it("returns undefined for empty candidates", () => {
    expect(suggest("hello", [])).toBeUndefined();
  });

  it("does not suggest the exact same string", () => {
    expect(suggest("Number", types)).toBeUndefined();
  });

  it("suggests struct field names", () => {
    const fields = ["name", "email", "age"];
    expect(suggest("nme", fields)).toBe("name");
    expect(suggest("emial", fields)).toBe("email");
  });
});

// ─── Unit: formatDiagnostic ───

describe("formatDiagnostic", () => {
  const source = `define greet(name: Text) -> Text as
  return nme
end`;

  it("formats an error with source context and caret", () => {
    const diagnostic: Diagnostic = {
      message: "Unknown variable 'nme'",
      position: { line: 2, column: 10 },
      severity: "error",
    };
    const result = formatDiagnostic(source, diagnostic);
    expect(result).toContain("error[2:10]: Unknown variable 'nme'");
    expect(result).toContain("return nme");
    expect(result).toContain("^^^");
  });

  it("includes a suggestion when provided", () => {
    const diagnostic: Diagnostic = {
      message: "Unknown variable 'nme'",
      position: { line: 2, column: 10 },
      severity: "error",
      suggestion: "name",
    };
    const result = formatDiagnostic(source, diagnostic);
    expect(result).toContain("did you mean 'name'?");
  });

  it("handles out-of-range line gracefully", () => {
    const diagnostic: Diagnostic = {
      message: "Bad thing",
      position: { line: 999, column: 1 },
      severity: "error",
    };
    const result = formatDiagnostic(source, diagnostic);
    expect(result).toBe("error[999:1]: Bad thing");
  });

  it("formats warnings with correct severity label", () => {
    const diagnostic: Diagnostic = {
      message: "Unused variable",
      position: { line: 1, column: 1 },
      severity: "warning",
    };
    const result = formatDiagnostic(source, diagnostic);
    expect(result).toContain("warning[1:1]:");
  });
});

describe("formatDiagnostics", () => {
  it("separates multiple diagnostics with blank lines", () => {
    const source = "line1\nline2";
    const diagnostics: Diagnostic[] = [
      { message: "error one", position: { line: 1, column: 1 }, severity: "error" },
      { message: "error two", position: { line: 2, column: 1 }, severity: "error" },
    ];
    const result = formatDiagnostics(source, diagnostics);
    const parts = result.split("\n\n");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Integration: ParseError ───

describe("ParseError", () => {
  it("is an instance of Error with position info", () => {
    try {
      parse(`define 42`);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ParseError);
      expect((err as ParseError).position).toBeDefined();
      expect((err as ParseError).position.line).toBeGreaterThan(0);
    }
  });
});

// ─── Integration: TypeChecker suggestions ───

describe("TypeChecker with suggestions", () => {
  it("suggests a type name for misspelled types", () => {
    const errors = check(`define greet(name: Tex) -> Void as
  return
end`);
    expect(errors.length).toBeGreaterThan(0);
    const err = errors.find((e) => e.message.includes("Unknown type 'Tex'"));
    expect(err).toBeDefined();
    expect(err!.suggestion).toBe("Text");
  });

  it("suggests a struct field for misspelled fields", () => {
    const errors = check(`struct User has
  name: Text
  email: Text
end

define make() -> User as
  return User(nme: "Alice", email: "a@b.com")
end`);
    expect(errors.length).toBeGreaterThan(0);
    const err = errors.find((e) => e.message.includes("Unknown field 'nme'"));
    expect(err).toBeDefined();
    expect(err!.suggestion).toBe("name");
  });

  it("does not suggest when the name is too far off", () => {
    const errors = check(`define greet(name: XyzzyWombat) -> Void as
  return
end`);
    const err = errors.find((e) => e.message.includes("Unknown type"));
    expect(err).toBeDefined();
    expect(err!.suggestion).toBeUndefined();
  });
});

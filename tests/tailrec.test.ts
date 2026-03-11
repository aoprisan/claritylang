import { describe, it, expect } from "vitest";
import { checkTailRecursion, transformTailRecToLoop } from "../src/typechecker/tailrec.js";
import { FunctionDef, CallExpr, Position } from "../src/parser/ast.js";
import { TypeScriptEmitter } from "../src/emitter/typescript.js";

const pos: Position = { line: 1, column: 1 };

function makeFunctionDef(overrides: Partial<FunctionDef> = {}): FunctionDef {
  return {
    kind: "FunctionDef",
    name: "factorial",
    params: [
      { name: "n", type: { kind: "SimpleType", name: "Number", position: pos } },
      { name: "acc", type: { kind: "SimpleType", name: "Number", position: pos } },
    ],
    returnType: { kind: "SimpleType", name: "Number", position: pos },
    body: [],
    annotations: [{ name: "tailrec", value: "", position: pos }],
    isAsync: false,
    position: pos,
    ...overrides,
  };
}

describe("checkTailRecursion", () => {
  it("should skip functions without @tailrec annotation", () => {
    const func = makeFunctionDef({ annotations: [] });
    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(false);
    expect(result.errors).toHaveLength(0);
  });

  it("should error when @tailrec function has no recursive calls", () => {
    const func = makeFunctionDef({
      body: [
        {
          kind: "ReturnStatement",
          value: { kind: "NumberLiteral", value: 42, position: pos },
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("no recursive calls");
  });

  it("should detect valid tail-recursive call in return position", () => {
    // @tailrec
    // define factorial(n: Number, acc: Number) -> Number as
    //   if n <= 1 then return acc
    //   else return factorial(n - 1, n * acc)
    //   end
    // end
    const func = makeFunctionDef({
      body: [
        {
          kind: "IfStatement",
          condition: {
            kind: "BinaryExpr",
            operator: "<=",
            left: { kind: "IdentifierExpr", name: "n", position: pos },
            right: { kind: "NumberLiteral", value: 1, position: pos },
            position: pos,
          },
          thenBlock: [
            {
              kind: "ReturnStatement",
              value: { kind: "IdentifierExpr", name: "acc", position: pos },
              position: pos,
            },
          ],
          elseIfClauses: [],
          elseBlock: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "CallExpr",
                callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
                args: [
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "-",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "NumberLiteral", value: 1, position: pos },
                      position: pos,
                    },
                  },
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "*",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "IdentifierExpr", name: "acc", position: pos },
                      position: pos,
                    },
                  },
                ],
                position: pos,
              },
              position: pos,
            },
          ],
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.recursiveCalls).toHaveLength(1);
    expect(result.tailCalls).toHaveLength(1);
  });

  it("should reject recursive call not in tail position (wrapped in binary expr)", () => {
    // return factorial(n - 1) * n  — NOT tail recursive
    const func = makeFunctionDef({
      params: [
        { name: "n", type: { kind: "SimpleType", name: "Number", position: pos } },
      ],
      body: [
        {
          kind: "ReturnStatement",
          value: {
            kind: "BinaryExpr",
            operator: "*",
            left: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
              args: [
                {
                  value: {
                    kind: "BinaryExpr",
                    operator: "-",
                    left: { kind: "IdentifierExpr", name: "n", position: pos },
                    right: { kind: "NumberLiteral", value: 1, position: pos },
                    position: pos,
                  },
                },
              ],
              position: pos,
            },
            right: { kind: "IdentifierExpr", name: "n", position: pos },
            position: pos,
          },
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("not in tail position");
  });

  it("should reject recursive call inside assignment RHS", () => {
    // x = factorial(n - 1)
    // return x
    const func = makeFunctionDef({
      body: [
        {
          kind: "Assignment",
          target: "x",
          value: {
            kind: "CallExpr",
            callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
            args: [
              {
                value: {
                  kind: "BinaryExpr",
                  operator: "-",
                  left: { kind: "IdentifierExpr", name: "n", position: pos },
                  right: { kind: "NumberLiteral", value: 1, position: pos },
                  position: pos,
                },
              },
              {
                value: { kind: "NumberLiteral", value: 1, position: pos },
              },
            ],
            position: pos,
          },
          position: pos,
        },
        {
          kind: "ReturnStatement",
          value: { kind: "IdentifierExpr", name: "x", position: pos },
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("not in tail position");
  });

  it("should detect tail call inside match case", () => {
    // match n on
    //   case 0 => return acc
    //   case _ => return factorial(n - 1, n * acc)
    // end
    const func = makeFunctionDef({
      body: [
        {
          kind: "MatchStatement",
          subject: { kind: "IdentifierExpr", name: "n", position: pos },
          cases: [
            {
              pattern: { kind: "LiteralPattern", value: 0 },
              body: [
                {
                  kind: "ReturnStatement",
                  value: { kind: "IdentifierExpr", name: "acc", position: pos },
                  position: pos,
                },
              ],
            },
            {
              pattern: { kind: "WildcardPattern" },
              body: [
                {
                  kind: "ReturnStatement",
                  value: {
                    kind: "CallExpr",
                    callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
                    args: [
                      {
                        value: {
                          kind: "BinaryExpr",
                          operator: "-",
                          left: { kind: "IdentifierExpr", name: "n", position: pos },
                          right: { kind: "NumberLiteral", value: 1, position: pos },
                          position: pos,
                        },
                      },
                      {
                        value: {
                          kind: "BinaryExpr",
                          operator: "*",
                          left: { kind: "IdentifierExpr", name: "n", position: pos },
                          right: { kind: "IdentifierExpr", name: "acc", position: pos },
                          position: pos,
                        },
                      },
                    ],
                    position: pos,
                  },
                  position: pos,
                },
              ],
            },
          ],
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject recursive call wrapped in propagate expr", () => {
    // return factorial(n - 1, acc)?  — propagation wraps the call
    const func = makeFunctionDef({
      body: [
        {
          kind: "ReturnStatement",
          value: {
            kind: "PropagateExpr",
            expr: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
              args: [
                {
                  value: {
                    kind: "BinaryExpr",
                    operator: "-",
                    left: { kind: "IdentifierExpr", name: "n", position: pos },
                    right: { kind: "NumberLiteral", value: 1, position: pos },
                    position: pos,
                  },
                },
                { value: { kind: "IdentifierExpr", name: "acc", position: pos } },
              ],
              position: pos,
            },
            position: pos,
          },
          position: pos,
        },
      ],
    });

    const result = checkTailRecursion(func);
    expect(result.isTailRecursive).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe("transformTailRecToLoop", () => {
  it("should transform tail-recursive factorial to loop structure", () => {
    const func = makeFunctionDef({
      body: [
        {
          kind: "IfStatement",
          condition: {
            kind: "BinaryExpr",
            operator: "<=",
            left: { kind: "IdentifierExpr", name: "n", position: pos },
            right: { kind: "NumberLiteral", value: 1, position: pos },
            position: pos,
          },
          thenBlock: [
            {
              kind: "ReturnStatement",
              value: { kind: "IdentifierExpr", name: "acc", position: pos },
              position: pos,
            },
          ],
          elseIfClauses: [],
          elseBlock: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "CallExpr",
                callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
                args: [
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "-",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "NumberLiteral", value: 1, position: pos },
                      position: pos,
                    },
                  },
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "*",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "IdentifierExpr", name: "acc", position: pos },
                      position: pos,
                    },
                  },
                ],
                position: pos,
              },
              position: pos,
            },
          ],
          position: pos,
        },
      ],
    });

    const transformed = transformTailRecToLoop(func);

    // Should be wrapped in a ForStatement (while(true) sentinel)
    expect(transformed.body).toHaveLength(1);
    expect(transformed.body[0].kind).toBe("ForStatement");

    // @tailrec annotation should be removed
    expect(transformed.annotations.find((a) => a.name === "tailrec")).toBeUndefined();
  });
});

describe("TypeScriptEmitter - @tailrec", () => {
  it("should emit tail-recursive function as while loop", () => {
    const func = makeFunctionDef({
      body: [
        {
          kind: "IfStatement",
          condition: {
            kind: "BinaryExpr",
            operator: "<=",
            left: { kind: "IdentifierExpr", name: "n", position: pos },
            right: { kind: "NumberLiteral", value: 1, position: pos },
            position: pos,
          },
          thenBlock: [
            {
              kind: "ReturnStatement",
              value: { kind: "IdentifierExpr", name: "acc", position: pos },
              position: pos,
            },
          ],
          elseIfClauses: [],
          elseBlock: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "CallExpr",
                callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
                args: [
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "-",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "NumberLiteral", value: 1, position: pos },
                      position: pos,
                    },
                  },
                  {
                    value: {
                      kind: "BinaryExpr",
                      operator: "*",
                      left: { kind: "IdentifierExpr", name: "n", position: pos },
                      right: { kind: "IdentifierExpr", name: "acc", position: pos },
                      position: pos,
                    },
                  },
                ],
                position: pos,
              },
              position: pos,
            },
          ],
          position: pos,
        },
      ],
    });

    const emitter = new TypeScriptEmitter();
    const output = emitter.emit({ kind: "Program", declarations: [func] });

    // Should contain while(true) loop
    expect(output).toContain("while (true)");
    // Should contain the continue sentinel
    expect(output).toContain("continue;");
    // Should NOT contain a recursive call like "return factorial(" inside the loop
    // (The function declaration itself will contain "factorial(", so check more precisely)
    const lines = output.split("\n");
    const recursiveCallLines = lines.filter(
      (l) => l.includes("factorial(") && !l.includes("function factorial(")
    );
    expect(recursiveCallLines).toHaveLength(0);
    // Should contain param reassignment
    expect(output).toContain("__tailrec_n");
    expect(output).toContain("__tailrec_acc");
  });

  it("should throw error for invalid @tailrec function", () => {
    const func = makeFunctionDef({
      params: [
        { name: "n", type: { kind: "SimpleType", name: "Number", position: pos } },
      ],
      body: [
        {
          kind: "ReturnStatement",
          value: {
            kind: "BinaryExpr",
            operator: "*",
            left: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "factorial", position: pos },
              args: [
                {
                  value: {
                    kind: "BinaryExpr",
                    operator: "-",
                    left: { kind: "IdentifierExpr", name: "n", position: pos },
                    right: { kind: "NumberLiteral", value: 1, position: pos },
                    position: pos,
                  },
                },
              ],
              position: pos,
            },
            right: { kind: "IdentifierExpr", name: "n", position: pos },
            position: pos,
          },
          position: pos,
        },
      ],
    });

    const emitter = new TypeScriptEmitter();
    expect(() =>
      emitter.emit({ kind: "Program", declarations: [func] })
    ).toThrow("Tail recursion errors");
  });
});

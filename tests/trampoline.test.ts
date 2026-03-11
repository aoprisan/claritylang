import { describe, it, expect } from "vitest";
import {
  findTrampolineGroups,
  validateTrampolineGroup,
  transformTrampolineGroup,
} from "../src/typechecker/trampoline.js";
import { FunctionDef, Program, Position } from "../src/parser/ast.js";
import { TypeScriptEmitter } from "../src/emitter/typescript.js";

const pos: Position = { line: 1, column: 1 };

function makeIsEven(): FunctionDef {
  return {
    kind: "FunctionDef",
    name: "isEven",
    params: [
      { name: "n", type: { kind: "SimpleType", name: "Number", position: pos } },
    ],
    returnType: { kind: "SimpleType", name: "Boolean", position: pos },
    annotations: [{ name: "trampoline", value: "isEven, isOdd", position: pos }],
    isAsync: false,
    position: pos,
    body: [
      {
        kind: "IfStatement",
        condition: {
          kind: "BinaryExpr",
          operator: "==",
          left: { kind: "IdentifierExpr", name: "n", position: pos },
          right: { kind: "NumberLiteral", value: 0, position: pos },
          position: pos,
        },
        thenBlock: [
          {
            kind: "ReturnStatement",
            value: { kind: "BooleanLiteral", value: true, position: pos },
            position: pos,
          },
        ],
        elseIfClauses: [],
        elseBlock: [
          {
            kind: "ReturnStatement",
            value: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "isOdd", position: pos },
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
            position: pos,
          },
        ],
        position: pos,
      },
    ],
  };
}

function makeIsOdd(): FunctionDef {
  return {
    kind: "FunctionDef",
    name: "isOdd",
    params: [
      { name: "n", type: { kind: "SimpleType", name: "Number", position: pos } },
    ],
    returnType: { kind: "SimpleType", name: "Boolean", position: pos },
    annotations: [{ name: "trampoline", value: "isEven, isOdd", position: pos }],
    isAsync: false,
    position: pos,
    body: [
      {
        kind: "IfStatement",
        condition: {
          kind: "BinaryExpr",
          operator: "==",
          left: { kind: "IdentifierExpr", name: "n", position: pos },
          right: { kind: "NumberLiteral", value: 0, position: pos },
          position: pos,
        },
        thenBlock: [
          {
            kind: "ReturnStatement",
            value: { kind: "BooleanLiteral", value: false, position: pos },
            position: pos,
          },
        ],
        elseIfClauses: [],
        elseBlock: [
          {
            kind: "ReturnStatement",
            value: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "isEven", position: pos },
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
            position: pos,
          },
        ],
        position: pos,
      },
    ],
  };
}

describe("findTrampolineGroups", () => {
  it("should return empty for programs without @trampoline", () => {
    const program: Program = {
      kind: "Program",
      declarations: [
        {
          kind: "FunctionDef",
          name: "foo",
          params: [],
          returnType: null,
          body: [],
          annotations: [],
          isAsync: false,
          position: pos,
        },
      ],
    };

    const groups = findTrampolineGroups(program);
    expect(groups).toHaveLength(0);
  });

  it("should group functions with matching @trampoline annotations", () => {
    const program: Program = {
      kind: "Program",
      declarations: [makeIsEven(), makeIsOdd()],
    };

    const groups = findTrampolineGroups(program);
    expect(groups).toHaveLength(1);
    expect(groups[0].functions).toHaveLength(2);
    expect(groups[0].functions.map((f) => f.name).sort()).toEqual([
      "isEven",
      "isOdd",
    ]);
  });
});

describe("validateTrampolineGroup", () => {
  it("should accept valid mutual tail calls", () => {
    const program: Program = {
      kind: "Program",
      declarations: [makeIsEven(), makeIsOdd()],
    };

    const groups = findTrampolineGroups(program);
    const errors = validateTrampolineGroup(groups[0]);
    expect(errors).toHaveLength(0);
  });

  it("should reject mutual call not in tail position", () => {
    const badIsEven: FunctionDef = {
      ...makeIsEven(),
      body: [
        {
          kind: "ReturnStatement",
          value: {
            kind: "BinaryExpr",
            operator: "+",
            left: {
              kind: "CallExpr",
              callee: { kind: "IdentifierExpr", name: "isOdd", position: pos },
              args: [
                {
                  value: { kind: "NumberLiteral", value: 1, position: pos },
                },
              ],
              position: pos,
            },
            right: { kind: "NumberLiteral", value: 1, position: pos },
            position: pos,
          },
          position: pos,
        },
      ],
    };

    const group = {
      functions: [badIsEven, makeIsOdd()],
      errors: [],
    };

    const errors = validateTrampolineGroup(group);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("not in tail position");
  });
});

describe("transformTrampolineGroup", () => {
  it("should produce internal and wrapper functions", () => {
    const group = {
      functions: [makeIsEven(), makeIsOdd()],
      errors: [],
    };

    const { internalFunctions, wrapperFunctions } =
      transformTrampolineGroup(group);

    expect(internalFunctions).toHaveLength(2);
    expect(wrapperFunctions).toHaveLength(2);

    expect(internalFunctions.map((f) => f.name).sort()).toEqual([
      "_trampoline_isEven",
      "_trampoline_isOdd",
    ]);
    expect(wrapperFunctions.map((f) => f.name).sort()).toEqual([
      "isEven",
      "isOdd",
    ]);
  });
});

describe("TypeScriptEmitter - @trampoline", () => {
  it("should emit trampoline pattern for mutually recursive functions", () => {
    const program: Program = {
      kind: "Program",
      declarations: [makeIsEven(), makeIsOdd()],
    };

    const emitter = new TypeScriptEmitter();
    const output = emitter.emit(program);

    // Should contain Thunk type
    expect(output).toContain("type Thunk<T>");
    expect(output).toContain("done: false");
    expect(output).toContain("done: true");

    // Should contain internal thunk-returning functions
    expect(output).toContain("_trampoline_isEven");
    expect(output).toContain("_trampoline_isOdd");

    // Should contain wrapper with trampoline loop
    expect(output).toContain("while (!__result.done)");
    expect(output).toContain("__result.fn()");
    expect(output).toContain("__result.value");
  });
});

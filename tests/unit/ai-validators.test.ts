import { describe, expect, it } from "vitest";
import { extractJson, validateAiOutput } from "@/ai/validators";

describe("extractJson", () => {
  it("parses raw JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("strips code fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("extracts JSON embedded in prose", () => {
    expect(extractJson('hello {"a":1} world')).toEqual({ a: 1 });
  });
  it("returns null for garbage", () => {
    expect(extractJson("not json")).toBeNull();
  });

  it("does not split on braces inside string values", () => {
    const s = '{"a":"contains { and } inside"}';
    expect(extractJson(s)).toEqual({ a: "contains { and } inside" });
  });
});

describe("validateAiOutput", () => {
  it("accepts a valid output", () => {
    const v = validateAiOutput({
      narration: "hello",
      effects: [{ type: "narrate", text: "extra" }],
    });
    expect(v?.narration).toBe("hello");
    expect(v?.effects[0]?.type).toBe("narrate");
  });

  it("rejects an effect with bad amount", () => {
    const v = validateAiOutput({
      narration: "x",
      effects: [{ type: "applyDamage", targetId: "a", amount: -1 }],
    });
    expect(v).toBeNull();
  });

  it("rejects a rollDice with bad notation", () => {
    const v = validateAiOutput({
      narration: "x",
      effects: [{ type: "rollDice", notation: "obviously not dice" }],
    });
    expect(v).toBeNull();
  });
});

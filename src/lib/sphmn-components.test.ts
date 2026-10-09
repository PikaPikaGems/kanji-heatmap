import { describe, expect, it } from "vitest";
import { prepareSphmnComponents } from "./sphmn-components";

// 口 is in 吾 and 語; 吾 is itself a component, in 語.
const data = prepareSphmnComponents([
  ["口", "吾語"],
  ["吾", "語"],
]);

describe("prepareSphmnComponents", () => {
  it("keeps drawer order and each component's kanji", () => {
    expect(data.order).toEqual(["口", "吾"]);
    expect(data.kanjiOf["吾"]).toEqual(["語"]);
  });

  it("indexes a component under itself, so search returns it too", () => {
    expect([...data.searchIndex["吾"]].sort()).toEqual(["口", "吾"].sort());
    expect([...data.searchIndex["語"]].sort()).toEqual(["口", "吾"].sort());
  });
});

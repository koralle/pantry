import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { bookmarkFormSchema } from "./schema";

describe("bookmarkFormSchema の parse", () => {
  test("parses URL and title into branded values", () => {
    const result = v.safeParse(bookmarkFormSchema, {
      note: "memo",
      title: "Example Article",
      url: "https://example.com/article",
    });

    expect(result.success && result.output).toStrictEqual({
      note: "memo",
      title: "Example Article",
      url: "https://example.com/article",
    });
  });

  test("normalizes an empty note to null", () => {
    const result = v.safeParse(bookmarkFormSchema, {
      note: "",
      title: "Example Article",
      url: "https://example.com/article",
    });

    expect(result.success && result.output.note).toBeNull();
  });
});

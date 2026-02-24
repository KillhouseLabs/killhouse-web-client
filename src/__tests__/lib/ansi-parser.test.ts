import { parseAnsi } from "@/lib/ansi-parser";

describe("ANSI Parser", () => {
  describe("parseAnsi", () => {
    it("GIVEN plain text without ANSI codes WHEN parsed THEN returns single segment with text", () => {
      const result = parseAnsi("Hello, World!");
      expect(result).toEqual([
        { text: "Hello, World!", color: null, bold: false },
      ]);
    });

    it("GIVEN empty string WHEN parsed THEN returns empty array", () => {
      const result = parseAnsi("");
      expect(result).toEqual([]);
    });

    it("GIVEN text with ANSI red color code WHEN parsed THEN returns segment with red color", () => {
      const result = parseAnsi("\x1b[31mError message\x1b[0m");
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Error message", color: "red" }),
        ])
      );
    });

    it("GIVEN text with ANSI green color code WHEN parsed THEN returns segment with green color", () => {
      const result = parseAnsi("\x1b[32mSuccess\x1b[0m");
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Success", color: "green" }),
        ])
      );
    });

    it("GIVEN text with ANSI yellow color code WHEN parsed THEN returns segment with yellow color", () => {
      const result = parseAnsi("\x1b[33mWarning\x1b[0m");
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Warning", color: "yellow" }),
        ])
      );
    });

    it("GIVEN text with ANSI blue color code WHEN parsed THEN returns segment with blue color", () => {
      const result = parseAnsi("\x1b[34mInfo\x1b[0m");
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Info", color: "blue" }),
        ])
      );
    });

    it("GIVEN text with ANSI bold code WHEN parsed THEN returns segment with bold flag", () => {
      const result = parseAnsi("\x1b[1mBold text\x1b[0m");
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Bold text", bold: true }),
        ])
      );
    });

    it("GIVEN text with ANSI reset code WHEN parsed THEN resets formatting between segments", () => {
      const result = parseAnsi(
        "\x1b[31mRed\x1b[0m Normal \x1b[32mGreen\x1b[0m"
      );
      expect(result.length).toBe(3);
      expect(result[0]).toMatchObject({ text: "Red", color: "red" });
      expect(result[1]).toMatchObject({
        text: " Normal ",
        color: null,
        bold: false,
      });
      expect(result[2]).toMatchObject({ text: "Green", color: "green" });
    });

    it("GIVEN text with nested bold+color WHEN parsed THEN returns segment with both", () => {
      const result = parseAnsi("\x1b[1m\x1b[31mBold Red\x1b[0m");
      const boldRedSegment = result.find((s) => s.text === "Bold Red");
      expect(boldRedSegment).toBeDefined();
      expect(boldRedSegment!.color).toBe("red");
      expect(boldRedSegment!.bold).toBe(true);
    });

    it("GIVEN text with ANSI codes and newlines WHEN parsed THEN preserves line breaks", () => {
      const result = parseAnsi("\x1b[31mLine 1\nLine 2\x1b[0m");
      const text = result.map((s) => s.text).join("");
      expect(text).toContain("\n");
    });

    it("GIVEN text with multiple color changes WHEN parsed THEN returns multiple segments", () => {
      const result = parseAnsi(
        "\x1b[31mRed\x1b[0m\x1b[32mGreen\x1b[0m\x1b[34mBlue\x1b[0m"
      );
      expect(result.length).toBe(3);
      expect(result[0].color).toBe("red");
      expect(result[1].color).toBe("green");
      expect(result[2].color).toBe("blue");
    });

    it("GIVEN text with color in middle WHEN parsed THEN splits into plain-colored-plain segments", () => {
      const result = parseAnsi("Normal \x1b[31mRed\x1b[0m Normal Again");
      expect(result.length).toBe(3);
      expect(result[0]).toMatchObject({ text: "Normal ", color: null });
      expect(result[1]).toMatchObject({ text: "Red", color: "red" });
      expect(result[2]).toMatchObject({ text: " Normal Again", color: null });
    });

    it("GIVEN text with only ANSI codes and no visible text WHEN parsed THEN returns empty array", () => {
      const result = parseAnsi("\x1b[31m\x1b[0m");
      // Either empty or segments with empty text should be filtered
      const nonEmpty = result.filter((s) => s.text.length > 0);
      expect(nonEmpty.length).toBe(0);
    });

    it("GIVEN text with bright color codes WHEN parsed THEN handles bright colors", () => {
      const result = parseAnsi("\x1b[91mBright Red\x1b[0m");
      const segment = result.find((s) => s.text === "Bright Red");
      expect(segment).toBeDefined();
      // Bright colors map to their base colors or a bright- prefix
      expect(segment!.color).toBeTruthy();
    });

    it("GIVEN text with unclosed ANSI code WHEN parsed THEN handles gracefully", () => {
      const result = parseAnsi("\x1b[31mRed text without reset");
      const text = result.map((s) => s.text).join("");
      expect(text).toBe("Red text without reset");
      expect(result[0].color).toBe("red");
    });
  });
});

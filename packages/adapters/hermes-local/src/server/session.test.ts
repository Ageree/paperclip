import { describe, expect, it } from "vitest";
import { sessionCodec } from "./session-codec.js";

describe("sessionCodec", () => {
  describe("deserialize", () => {
    it("extracts sessionId from camelCase key", () => {
      const result = sessionCodec.deserialize({ sessionId: "ses_abc" });
      expect(result).toEqual({ sessionId: "ses_abc" });
    });

    it("extracts sessionId from snake_case key", () => {
      const result = sessionCodec.deserialize({ session_id: "ses_def" });
      expect(result).toEqual({ sessionId: "ses_def" });
    });

    it("returns null for missing sessionId", () => {
      const result = sessionCodec.deserialize({ foo: "bar" });
      expect(result).toBeNull();
    });

    it("returns null for empty string sessionId", () => {
      const result = sessionCodec.deserialize({ sessionId: "  " });
      expect(result).toBeNull();
    });

    it("returns null for non-object input", () => {
      expect(sessionCodec.deserialize(null)).toBeNull();
      expect(sessionCodec.deserialize("string")).toBeNull();
      expect(sessionCodec.deserialize(42)).toBeNull();
      expect(sessionCodec.deserialize([1, 2])).toBeNull();
    });
  });

  describe("serialize", () => {
    it("normalizes sessionId", () => {
      const result = sessionCodec.serialize({ sessionId: "ses_xyz" });
      expect(result).toEqual({ sessionId: "ses_xyz" });
    });

    it("normalizes snake_case to camelCase", () => {
      const result = sessionCodec.serialize({ session_id: "ses_123" });
      expect(result).toEqual({ sessionId: "ses_123" });
    });

    it("returns null for null input", () => {
      expect(sessionCodec.serialize(null)).toBeNull();
    });

    it("returns null for empty sessionId", () => {
      expect(sessionCodec.serialize({ sessionId: "" })).toBeNull();
    });
  });

  describe("getDisplayId", () => {
    it("returns sessionId string", () => {
      expect(sessionCodec.getDisplayId?.({ sessionId: "ses_abc" })).toBe("ses_abc");
    });

    it("returns null for null input", () => {
      expect(sessionCodec.getDisplayId?.(null)).toBeNull();
    });
  });
});

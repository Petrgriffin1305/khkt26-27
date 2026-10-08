import { afterEach, expect, it, vi } from "vitest";
import { emptySaved, readSaved, writeSaved } from "../../src/adventure/storage";
const entries = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => entries.set(key, value),
});
afterEach(() => entries.clear());
it("round trips saved study under a separate key for each owner", () => {
  const saved = emptySaved();
  saved.notes.one = "Private study notes";
  writeSaved("learner", saved);
  expect(readSaved("learner").notes.one).toBe("Private study notes");
  expect(readSaved("guest").notes).toEqual({});
});
it("retains attachment metadata after completing a session and reads older backups", () => {
  const saved = emptySaved();
  saved.materials = { session: [{ name: "lesson.pdf", size: 600, type: "application/pdf", status: "extracted", message: "Đã đọc" }] };
  writeSaved("learner", saved);
  expect(readSaved("learner").materials?.session[0].name).toBe("lesson.pdf");
  delete saved.materials;
  writeSaved("learner", saved);
  expect(readSaved("learner").notes).toEqual({});
});
it.each([
  { local: {}, pending: [], notes: {} },
  { ...emptySaved(), active: { state: "focus", segments: null } },
  { ...emptySaved(), snapshot: { person: null, sessions: [] } },
])("rejects damaged saved shapes before the timer or journey can crash", (value) => {
  entries.set("train-adventure:v1:guest", JSON.stringify(value));
  expect(() => readSaved("guest")).toThrow("Dữ liệu");
  expect(entries.get("train-adventure:v1:guest")).toBe(JSON.stringify(value));
});

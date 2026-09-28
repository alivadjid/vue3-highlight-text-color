import { describe, expect, it } from "vitest";

import {
  createMarkerFromRange,
  renderMarkers,
  subtractMarkerRange,
} from "./highlight";

function createRoot(source: string) {
  const root = document.createElement("div");
  root.innerHTML = source;
  return root;
}

describe("highlight core", () => {
  it("serializes a selection inside nested DOM as textContent offsets", () => {
    const root = createRoot("<p>Привет, <strong>мир</strong>!</p>");
    const text = root.querySelector("strong")?.firstChild;
    const selection = document.createRange();

    selection.setStart(text!, 0);
    selection.setEnd(text!, 3);

    expect(createMarkerFromRange(root, selection, "#FA7E61", 1)).toEqual({
      color: "#FA7E61",
      range: { start: 8, end: 11 },
      textId: 1,
    });
  });

  it("restores a marker without changing the source DOM structure", () => {
    const source = "<p>Hello <strong>world</strong>!</p>";
    const root = createRoot(source);
    const markers = [
      {
        id: "world",
        textId: 1,
        color: "#FA7E61",
        range: { start: 6, end: 11 },
      },
    ];

    renderMarkers(root, source, markers, 1);

    expect(root.textContent).toBe("Hello world!");
    expect(root.querySelector("strong > span")?.textContent).toBe("world");
    expect(root.querySelector("span")?.dataset.highlightId).toBe("world");

    const firstRender = root.innerHTML;
    renderMarkers(root, source, markers, 1);
    expect(root.innerHTML).toBe(firstRender);
  });

  it("uses the last marker as the visual priority for an overlap", () => {
    const root = createRoot("abcdef");
    const markers = [
      {
        id: "first",
        textId: 1,
        color: "#ff0000",
        range: { start: 1, end: 5 },
      },
      {
        id: "last",
        textId: 1,
        color: "#0000ff",
        range: { start: 3, end: 6 },
      },
    ];

    renderMarkers(root, "abcdef", markers, 1);

    const spans = Array.from(root.querySelectorAll("span"));
    expect(spans.map((span) => span.textContent)).toEqual(["bc", "def"]);
    expect(spans.map((span) => span.dataset.highlightId)).toEqual([
      "first",
      "last",
    ]);
  });

  it("exposes the marker colour as a CSS variable, including inside code", () => {
    const source = "<p>Before <code>code</code> after</p>";
    const root = createRoot(source);
    const marker = {
      id: "all",
      textId: 1,
      color: "#86EFAC",
      range: { start: 0, end: 17 },
    };

    renderMarkers(root, source, [marker], 1);

    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>("span"));
    expect(spans).toHaveLength(3);
    expect(
      root.querySelector<HTMLSpanElement>("code > span")?.dataset.highlightId
    ).toBe("all");
    expect(
      spans.map((span) => span.style.getPropertyValue("--vth-highlight-color"))
    ).toEqual(["#86EFAC", "#86EFAC", "#86EFAC"]);
  });

  it("ignores malformed and out-of-bounds persisted markers", () => {
    const root = createRoot("hello");
    const markers = [
      null,
      { id: "old", textId: 1, color: "#fff" },
      {
        id: "outside",
        textId: 1,
        color: "#fff",
        range: { start: 0, end: 10 },
      },
    ] as never[];

    renderMarkers(root, "hello", markers, 1);

    expect(root.innerHTML).toBe("hello");
  });

  it("splits a marker when only its inner range is removed", () => {
    const markers = [
      {
        id: "whole",
        textId: 1,
        color: "#0F766E",
        range: { start: 1, end: 8 },
      },
      {
        id: "other-document",
        textId: 2,
        color: "#0F766E",
        range: { start: 1, end: 8 },
      },
    ];

    expect(
      subtractMarkerRange(markers, { textId: 1, range: { start: 3, end: 6 } })
    ).toEqual([
      {
        id: "whole",
        textId: 1,
        color: "#0F766E",
        range: { start: 1, end: 3 },
      },
      {
        id: "whole:after:6",
        textId: 1,
        color: "#0F766E",
        range: { start: 6, end: 8 },
      },
      {
        id: "other-document",
        textId: 2,
        color: "#0F766E",
        range: { start: 1, end: 8 },
      },
    ]);
  });
});

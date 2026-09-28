import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import TextDataKey from "./TextDataKey.vue";
import TextDataKeyWithExpansion from "./TextDataKeyWithExpansion.vue";
import type { ColorPickerSlotProps } from "../interface";

async function settle() {
  await nextTick();
  await nextTick();
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  window.getSelection()?.removeAllRanges();
});

describe("TextDataKeyWithExpansion", () => {
  it("teleports the color palette outside the text document", async () => {
    const wrapper = mount(TextDataKeyWithExpansion, {
      attachTo: document.body,
      props: {
        text: "<p>Hello world</p>",
        textId: 1,
        markers: [],
      },
    });

    await settle();

    const textRoot = wrapper.findComponent(TextDataKey).element;
    const textNode = textRoot.querySelector("p")?.firstChild;
    const range = document.createRange();
    range.setStart(textNode!, 0);
    range.setEnd(textNode!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const textDataKey = wrapper.findComponent(TextDataKey);
    await textDataKey.trigger("mousedown");
    await textDataKey.trigger("mousemove");
    await textDataKey.trigger("mouseup");
    await settle();

    const menu = document.body.querySelector('[role="dialog"]');
    expect(menu).not.toBeNull();
    expect(textRoot.contains(menu)).toBe(false);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("emits a marker after selecting text and choosing a color", async () => {
    const wrapper = mount(TextDataKeyWithExpansion, {
      attachTo: document.body,
      props: {
        text: "<p>Hello world</p>",
        textId: 1,
        markers: [],
      },
    });

    await settle();

    const textRoot = wrapper.findComponent(TextDataKey).element;
    const textNode = textRoot.querySelector("p")?.firstChild;
    const range = document.createRange();
    range.setStart(textNode!, 0);
    range.setEnd(textNode!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await wrapper.findComponent(TextDataKey).trigger("mousedown");
    await wrapper.findComponent(TextDataKey).trigger("mousemove");
    await wrapper.findComponent(TextDataKey).trigger("mouseup");
    await settle();

    const colorButton = document.body.querySelector("button");
    expect(colorButton).not.toBeNull();
    colorButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();

    expect(wrapper.emitted("handleNewHighlight")).toEqual([
      [
        {
          color: "#4C1E4F",
          range: { start: 0, end: 5 },
          textId: 1,
        },
      ],
    ]);
  });

  it("lets a color-picker slot replace the default palette", async () => {
    const wrapper = mount(TextDataKeyWithExpansion, {
      attachTo: document.body,
      props: {
        text: "<p>Hello world</p>",
        textId: 1,
        markers: [],
        colors: ["#f97316"],
      },
      slots: {
        "color-picker": ({ chooseColor, colors }: ColorPickerSlotProps) =>
          h(
            "button",
            {
              "data-testid": "custom-picker",
              onClick: () => chooseColor(colors[0]),
            },
            "Use custom picker"
          ),
      },
    });

    await settle();

    const textRoot = wrapper.findComponent(TextDataKey).element;
    const textNode = textRoot.querySelector("p")?.firstChild;
    const range = document.createRange();
    range.setStart(textNode!, 0);
    range.setEnd(textNode!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const textDataKey = wrapper.findComponent(TextDataKey);
    await textDataKey.trigger("mousedown");
    await textDataKey.trigger("mousemove");
    await textDataKey.trigger("mouseup");
    await settle();

    expect(document.body.querySelector('[data-testid="custom-picker"]')).not.toBeNull();
    expect(document.body.querySelector('[aria-label^="Выбрать цвет"]')).toBeNull();

    document.body
      .querySelector('[data-testid="custom-picker"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();

    expect(wrapper.emitted("handleNewHighlight")).toEqual([
      [
        {
          color: "#f97316",
          range: { start: 0, end: 5 },
          textId: 1,
        },
      ],
    ]);
  });

  it("emits the selected range to remove intersecting highlights", async () => {
    const wrapper = mount(TextDataKeyWithExpansion, {
      attachTo: document.body,
      props: {
        text: "<p>Hello world</p>",
        textId: 1,
        markers: [],
      },
    });

    await settle();

    const textRoot = wrapper.findComponent(TextDataKey).element;
    const textNode = textRoot.querySelector("p")?.firstChild;
    const range = document.createRange();
    range.setStart(textNode!, 0);
    range.setEnd(textNode!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const textDataKey = wrapper.findComponent(TextDataKey);
    await textDataKey.trigger("mousedown");
    await textDataKey.trigger("mousemove");
    await textDataKey.trigger("mouseup");
    await settle();

    const removeButton = document.body.querySelector(
      'button[aria-label="Убрать выделение"]'
    );
    removeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();

    expect(wrapper.emitted("handleRemoveHighlight")).toEqual([
      [
        {
          range: { start: 0, end: 5 },
          textId: 1,
        },
      ],
    ]);
  });

  it("keeps the palette open while the pointer is over it", async () => {
    vi.useFakeTimers();

    const wrapper = mount(TextDataKeyWithExpansion, {
      attachTo: document.body,
      props: {
        text: "<p>Hello world</p>",
        textId: 1,
        markers: [],
      },
    });

    await settle();

    const textRoot = wrapper.findComponent(TextDataKey).element;
    const textNode = textRoot.querySelector("p")?.firstChild;
    const range = document.createRange();
    range.setStart(textNode!, 0);
    range.setEnd(textNode!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const textDataKey = wrapper.findComponent(TextDataKey);
    await textDataKey.trigger("mousedown");
    await textDataKey.trigger("mousemove");
    await textDataKey.trigger("mouseup");
    await settle();

    const menu = document.body.querySelector('[role="dialog"]');
    expect(menu).not.toBeNull();
    menu?.dispatchEvent(new Event("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(3_500);
    await settle();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

    menu?.dispatchEvent(new Event("pointerleave", { bubbles: true }));
    vi.advanceTimersByTime(3_500);
    await settle();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});

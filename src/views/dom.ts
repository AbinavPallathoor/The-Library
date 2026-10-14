export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = "",
  text?: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  parent?.append(e);
  return e;
}
export function button(
  parent: HTMLElement,
  text: string,
  action: () => unknown,
  cls = "",
) {
  const b = el("button", cls, text, parent);
  b.type = "button";
  b.addEventListener("click", () => void action());
  return b;
}
export function field(
  parent: HTMLElement,
  label: string,
  placeholder = "",
  multiline = false,
) {
  const l = el("label", "clear-field", label, parent);
  const input = multiline
    ? el("textarea", "", undefined, l)
    : el("input", "", undefined, l);
  input.placeholder = placeholder;
  return input;
}
export function select(
  parent: HTMLElement,
  label: string,
  options: [string, string][],
  value: string,
  change: (value: string) => void,
) {
  const s = el("select", "", undefined, parent);
  s.setAttribute("aria-label", label);
  for (const [v, t] of options) {
    const o = el("option", "", t, s);
    o.value = v;
  }
  s.value = value;
  s.onchange = () => change(s.value);
  return s;
}

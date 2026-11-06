import { beginScope, endScope } from "./runtime";
import { SIMS } from "./sims";
import "./sims-extra";

/** Build the named simulation inside `el`. Returns a cleanup that stops its animation loops. */
export function mountSim(name: string, el: HTMLElement): () => void {
  const scope = beginScope();
  try {
    const fn = SIMS[name];
    if (fn) fn(el);
    else el.textContent = `Simulation "${name}" not found.`;
  } finally {
    endScope();
  }
  return () => scope.forEach((stop) => stop());
}

export { mount as mountLab } from "./lab";
export { beginScope, endScope };

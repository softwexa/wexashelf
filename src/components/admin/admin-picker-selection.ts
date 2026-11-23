/** Append only displayed identities, preserving all existing choices and their order. */
export function selectVisibleRecords(current: readonly string[], visible: readonly string[], maximum?: number): string[] {
  const next = [...current];
  const selected = new Set(current);
  for (const id of visible) {
    if (maximum !== undefined && next.length >= maximum) break;
    if (!selected.has(id)) {
      next.push(id);
      selected.add(id);
    }
  }
  return next;
}

/** Remove displayed identities without disturbing hidden choices or their order. */
export function clearVisibleRecords(current: readonly string[], visible: readonly string[]): string[] {
  const displayed = new Set(visible);
  return current.filter(id => !displayed.has(id));
}

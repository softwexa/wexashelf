import assert from "node:assert/strict";
import test from "node:test";
import { clearVisibleRecords, selectVisibleRecords } from "../src/components/admin/admin-picker-selection";

test("visible selection retains hidden choices and appends unique results in display order up to capacity", () => {
  const current = ["hidden", "second"];
  assert.deepEqual(selectVisibleRecords(current, ["first", "second", "first", "third"], 4), ["hidden", "second", "first", "third"]);
  assert.deepEqual(selectVisibleRecords(current, ["first", "third"], 3), ["hidden", "second", "first"]);
  assert.deepEqual(current, ["hidden", "second"]);
});

test("visible selection respects zero/full/over-limit capacity and can be unlimited", () => {
  assert.deepEqual(selectVisibleRecords([], ["first"], 0), []);
  assert.deepEqual(selectVisibleRecords(["hidden"], ["first"], 1), ["hidden"]);
  assert.deepEqual(selectVisibleRecords(["hidden", "other"], ["first"], 1), ["hidden", "other"]);
  assert.deepEqual(selectVisibleRecords([], ["first", "second"]), ["first", "second"]);
});

test("clear only removes currently visible choices, preserving hidden order", () => {
  assert.deepEqual(clearVisibleRecords(["hidden", "second", "other", "first"], ["first", "second", "unselected"]), ["hidden", "other"]);
  assert.deepEqual(clearVisibleRecords(["hidden"], []), ["hidden"]);
});

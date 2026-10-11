// Task list. Open tasks first, completed tasks below, newest first in each group.

import { load, save } from "./store.js";

const KEY = "tasks";
const MAX_TASKS = 200;

const els = {
  form: document.getElementById("task-form"),
  input: document.getElementById("task-input"),
  list: document.getElementById("task-list"),
  empty: document.getElementById("task-empty"),
  count: document.getElementById("tasks-count"),
};

let tasks = [];

function render() {
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const ordered = [...open, ...done];

  els.list.replaceChildren(...ordered.map(renderItem));
  els.empty.hidden = open.length > 0;
  els.count.textContent = open.length ? `${open.length} open` : "";
}

function renderItem(task) {
  const li = document.createElement("li");
  if (task.done) li.classList.add("task-done");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "task-check";
  check.checked = task.done;
  check.setAttribute("aria-label", `Mark "${task.text}" ${task.done ? "open" : "done"}`);
  check.addEventListener("change", () => toggle(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;
  text.title = task.text;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-btn";
  remove.setAttribute("aria-label", `Delete "${task.text}"`);
  remove.textContent = "×";
  remove.addEventListener("click", () => destroy(task.id));

  li.append(check, text, remove);
  return li;
}

function toggle(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  commit();
}

function destroy(id) {
  tasks = tasks.filter((t) => t.id !== id);
  commit();
}

function commit() {
  save(KEY, tasks);
  render();
}

export async function initTasks() {
  const saved = await load(KEY, []);
  tasks = Array.isArray(saved) ? saved.slice(0, MAX_TASKS) : [];

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.input.value.trim();
    if (!text || tasks.length >= MAX_TASKS) return;
    tasks = [{ id: crypto.randomUUID(), text, done: false, created: Date.now() }, ...tasks];
    els.input.value = "";
    commit();
  });

  render();
}

export function focusTaskInput() {
  els.input.focus();
}

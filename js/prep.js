// Assessment Prep: the quant-test study list with time budgets and a purpose for each item.
// The list is static, so it lives here. Only the tick marks are stored (key "prepDone").
// Time figures are planning estimates for one pass at a steady pace, not measured.

import { load, save } from "./store.js";

const DONE_KEY = "prepDone";
const HANDBOOK = "file:///Users/tanishkyadav/Documents/SecondBrain/GitHub/quant-interview-handbook/Quant-Interview-Handbook.pdf";

// priority 1 = before the next assessment, 2 = next, 3 = when the above is solid.
const ITEMS = [
  {
    id: "zetamac", group: "Speed", priority: 1, minutes: 15, cadence: "daily",
    title: "Zetamac arithmetic drill",
    url: "https://arithmetic.zetamac.com/",
    purpose: "Builds the raw mental-arithmetic speed that IMC/SHL, Optiver and SIG style numerical sections punish you for lacking.",
    how: "Default settings, 120 seconds, one run a day. Aim for 40+ and keep the streak rather than doing long sessions.",
    matters: "IMC, Optiver, SIG, Flow Traders, any timed numerical test.",
  },
  {
    id: "shl", group: "Speed", priority: 1, minutes: 90, cadence: "3 timed sets",
    title: "SHL-style numerical reasoning sets",
    url: "https://www.practiceaptitudetests.com/numerical-reasoning-tests/",
    purpose: "Teaches the exact format: tables and charts, tight clock, answers by estimation. Removes surprise on test day.",
    how: "Three timed sets, no calculator unless the real test allows one. Review every miss for whether it was a reading error or a speed error.",
    matters: "IMC Trader SHL test (still pending), most graduate numerical screens.",
  },
  {
    id: "hb-mental", group: "Speed", priority: 1, minutes: 120, cadence: "6 sets",
    title: "Handbook Ch 2: mental math and sequences",
    url: HANDBOOK,
    purpose: "Your own drill sets for mental math and number sequences, with worked solutions.",
    how: "One set per sitting, timed at 20 minutes. Read the solution method even when you were right; there is often a faster route.",
    matters: "Same tests as Zetamac, plus the sequence questions Zetamac does not cover.",
  },
  {
    id: "stat110", group: "Probability", priority: 1, minutes: 600, cadence: "Lectures 1-12",
    title: "Harvard Stat 110 lectures (Blitzstein)",
    url: "https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo",
    purpose: "Builds real probability intuition: counting, conditioning, Bayes, expectation and linearity. The theory under almost every interview question.",
    how: "Lectures 1-12 only at first. Watch at 1.25x, pause before each solution and try it. Skip the rest until the problem sets feel easy.",
    matters: "Jane Street, HRT, Citadel, Jump, and every probability screen.",
  },
  {
    id: "hb-counting", group: "Probability", priority: 1, minutes: 480, cadence: "50 problems",
    title: "Handbook Ch 3-5: counting, Bayes, expectation",
    url: HANDBOOK,
    purpose: "The highest-yield probability material: 18 counting, 13 Bayes and 19 expectation problems with checked solutions.",
    how: "Attempt a whole set before opening any solution. Flag a problem for a second pass if you needed the answer.",
    matters: "Nearly every quant trader and researcher online test.",
  },
  {
    id: "hb-classics", group: "Probability", priority: 2, minutes: 480, cadence: "47 problems",
    title: "Handbook Ch 6-8: classics, Markov, continuous",
    url: HANDBOOK,
    purpose: "The named problems everyone gets asked (gambler's ruin, coupon collector, random walks), plus Markov chains and geometric probability.",
    how: "Do after Ch 3-5 is comfortable. Markov chains and recursion problems pay off most.",
    matters: "Jane Street, HRT, Citadel, Two Sigma style probability rounds.",
  },
  {
    id: "hb-trading", group: "Trading", priority: 1, minutes: 180, cadence: "15 problems",
    title: "Handbook Ch 13: trading games and market making",
    url: HANDBOOK,
    purpose: "Quoting a bid and ask around a fair value, reasoning about adverse selection, and expected value of bets under information asymmetry.",
    how: "State your fair value and spread out loud (or on paper) before reading the solution. The reasoning matters more than the number.",
    matters: "Optiver, IMC, SIG, Jane Street trader assessments.",
  },
  {
    id: "figgie", group: "Trading", priority: 2, minutes: 60, cadence: "3 games",
    title: "Figgie (Jane Street card game)",
    url: "https://www.figgie.com",
    purpose: "Trains live market-making instinct: inferring hidden information from other people's quotes and trades.",
    how: "Play three short games. After each, note one mistake you made as a buyer and one as a seller.",
    matters: "Jane Street, and a good proxy for any market-making interview game.",
  },
  {
    id: "hb-brain", group: "Logic", priority: 2, minutes: 240, cadence: "33 problems",
    title: "Handbook Ch 14-15: brainteasers and game theory",
    url: HANDBOOK,
    purpose: "Induction, invariants, pigeonhole, winning and losing positions. Short problems that test clean thinking under time pressure.",
    how: "Cap yourself at 8 minutes per problem, then read the solution. Learn the pattern, not the puzzle.",
    matters: "Logic sections on SHL-style and firm-specific tests, plus live interviews.",
  },
  {
    id: "hb-fermi", group: "Logic", priority: 3, minutes: 60, cadence: "6 problems",
    title: "Handbook Ch 20: Fermi estimation",
    url: HANDBOOK,
    purpose: "Quick order-of-magnitude estimation, which numerical and trader interviews use to check how you reason with rough numbers.",
    how: "Write the assumptions down before computing. A sensible decomposition beats an accurate guess.",
    matters: "Optiver and SIG interviews, some numerical sections.",
  },
  {
    id: "neetcode", group: "Coding", priority: 2, minutes: 720, cadence: "core 40",
    title: "NeetCode: arrays, hashing, two pointers, heaps, DP",
    url: "https://neetcode.io/practice",
    purpose: "Fluency on the data-structure patterns HackerRank and CodeSignal screens draw from, so the coding round costs you no extra thought.",
    how: "Easy and Medium only, about 40 problems from those categories. Timed at 20 minutes, then watch the solution if stuck.",
    matters: "Citadel, Jump, Akuna, DRW, any HackerRank or CodeSignal screen.",
  },
  {
    id: "hb-coding", group: "Coding", priority: 3, minutes: 240, cadence: "29 problems",
    title: "Handbook Ch 18: coding, algorithms and C++",
    url: HANDBOOK,
    purpose: "Quant-flavoured coding: algorithms plus C++ and numerical problems of the kind trading firms ask.",
    how: "After NeetCode basics are smooth. Write the code by hand first, then compare with the printed solution.",
    matters: "Quant developer and researcher assessments, C++ heavy firms.",
  },
];

const GROUPS = ["Speed", "Probability", "Trading", "Logic", "Coding"];

const PLAN = {
  purpose: "A single place to work through the topics that quant online assessments test, in the order that pays off fastest, using material you already own where possible.",
  time: "About 5 to 6 hours a week alongside coursework. A full single pass of everything here is roughly 55 hours, so about 2 to 3 months at that pace.",
  how: "Priority 1 first (speed and core probability, plus market-making), then 2, then 3. Do 15 minutes of Zetamac daily and one longer block on most days. Tick items as you finish them.",
  matters: "Pending IMC SHL test now, then whichever assessments arrive next. Heavy exam weeks (6023 midterm, 6901 final) should keep the daily drill only.",
};

let done = new Set();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatMinutes(m) {
  if (m < 60) return `${m} min`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

function openUrl(url) {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, "_blank", "noopener");
  }
}

function infoPanel(fields) {
  const dl = el("dl", "prep-info-body");
  for (const [label, text] of fields) {
    dl.append(el("dt", null, label), el("dd", null, text));
  }
  return dl;
}

function toggleInfo(button, panel) {
  const open = panel.hidden;
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

function infoButton(label, panel) {
  const btn = el("button", "prep-info-btn", "i");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => toggleInfo(btn, panel));
  return btn;
}

function renderItem(item) {
  const li = el("li", "prep-item");
  li.dataset.id = item.id;
  const row = el("div", "prep-row");

  const check = el("input", "prep-check");
  check.type = "checkbox";
  check.checked = done.has(item.id);
  check.setAttribute("aria-label", `Mark done: ${item.title}`);
  check.addEventListener("change", async () => {
    if (check.checked) done.add(item.id);
    else done.delete(item.id);
    await save(DONE_KEY, [...done]);
    renderSummary();
    li.classList.toggle("is-done", check.checked);
  });

  const open = el("button", "prep-open");
  open.type = "button";
  open.title = "Open resource";
  open.append(el("span", "prep-title", item.title));
  open.append(el("span", "prep-sub", `P${item.priority} · ${item.cadence}`));
  open.addEventListener("click", () => openUrl(item.url));

  const time = el("span", "prep-time", formatMinutes(item.minutes));

  const panel = el("div", "prep-info");
  panel.hidden = true;
  panel.append(infoPanel([
    ["Purpose", item.purpose],
    ["Time", `${formatMinutes(item.minutes)} (${item.cadence}). Estimate for one pass.`],
    ["How to use it", item.how],
    ["Matters for", item.matters],
  ]));

  row.append(check, open, time, infoButton(`About: ${item.title}`, panel));
  li.classList.toggle("is-done", done.has(item.id));
  li.append(row, panel);
  return li;
}

function renderSummary() {
  const meta = document.getElementById("prep-meta");
  if (!meta) return;
  const left = ITEMS.filter((i) => !done.has(i.id)).reduce((s, i) => s + i.minutes, 0);
  const doneCount = ITEMS.filter((i) => done.has(i.id)).length;
  meta.textContent = `${doneCount} of ${ITEMS.length} done · ~${formatMinutes(left)} left`;
}

function nextItem() {
  return [...ITEMS]
    .filter((i) => !done.has(i.id))
    .sort((a, b) => a.priority - b.priority)[0];
}

export async function initPrep() {
  const groups = document.getElementById("prep-groups");
  if (!groups) return;

  const stored = await load(DONE_KEY, []);
  done = new Set(Array.isArray(stored) ? stored.filter((id) => ITEMS.some((i) => i.id === id)) : []);

  groups.replaceChildren(
    ...GROUPS.map((name) => {
      const section = el("div", "prep-group");
      section.append(el("p", "jobs-label", name));
      const list = el("ul", "prep-list");
      list.append(...ITEMS.filter((i) => i.group === name).map(renderItem));
      section.append(list);
      return section;
    }),
  );

  const planPanel = document.getElementById("prep-plan");
  planPanel.replaceChildren(infoPanel([
    ["Purpose", PLAN.purpose],
    ["Time to dedicate", PLAN.time],
    ["How to use it", PLAN.how],
    ["Right now", PLAN.matters],
  ]));
  const planBtn = document.getElementById("prep-info-btn");
  planBtn.addEventListener("click", () => toggleInfo(planBtn, planPanel));

  document.getElementById("prep-next")?.addEventListener("click", () => {
    const next = nextItem();
    if (next) openUrl(next.url);
  });

  renderSummary();
}

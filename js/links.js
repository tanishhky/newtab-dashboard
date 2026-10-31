// Practice material and quick links. Static on purpose: edit the two lists below.

import { openUrl } from "./open.js";

const BOOKS = "file:///Users/tanishkyadav/Documents/SecondBrain/GitHub";

const PRACTICE = [
  {
    title: "Quant Dojo",
    sub: "Adaptive practice: probability, statistics, quant finance",
    badge: "Artifact",
    url: "https://claude.ai/artifact/8McuMGKU5HN2LLHY7XbTEy",
  },
  {
    title: "Quant Dojo book",
    sub: "20 chapters that go with the practice site",
    badge: "PDF",
    url: `${BOOKS}/quant-dojo/book/Quant-Dojo.pdf`,
  },
  {
    title: "Quant Interview Handbook",
    sub: "Mental math, probability, trading games, brainteasers, with solutions",
    badge: "PDF",
    url: `${BOOKS}/quant-interview-handbook/Quant-Interview-Handbook.pdf`,
  },
];

const LINKS = [
  ["Gmail", "https://mail.google.com/mail/u/?authuser=ty2766@nyu.edu"],
  ["Calendar", "https://calendar.google.com/calendar/r?authuser=ty2766@nyu.edu"],
  ["Todoist", "https://app.todoist.com"],
  ["Brightspace", "https://brightspace.nyu.edu"],
  ["Overleaf", "https://www.overleaf.com/project"],
  ["GitHub", "https://github.com/tanishhky"],
  ["LinkedIn", "https://www.linkedin.com/feed/"],
  ["WRDS", "https://wrds-www.wharton.upenn.edu"],
  ["SSRN", "https://hq.ssrn.com"],
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function problem(message, actions = []) {
  const box = document.getElementById("practice-note") ?? (() => {
    const p = el("p", "note");
    p.id = "practice-note";
    document.getElementById("practice-list").after(p);
    return p;
  })();
  box.replaceChildren(el("span", null, message), ...actions);
}

export function initLinks() {
  document.getElementById("practice-list").replaceChildren(
    ...PRACTICE.map((item) => {
      const li = el("li");
      const a = el("a", "tile");
      a.href = item.url;
      const text = el("div", "row-main");
      text.append(el("span", "row-title", item.title), el("span", "row-sub", item.sub));
      a.append(text, el("span", "tag tag-rose", item.badge));
      a.addEventListener("click", (event) => {
        event.preventDefault();
        openUrl(item.url, { onProblem: problem });
      });
      li.append(a);
      return li;
    }),
  );

  document.getElementById("link-list").replaceChildren(
    ...LINKS.map(([label, url]) => {
      const li = el("li");
      const a = el("a", "chip", label);
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      li.append(a);
      return li;
    }),
  );
}

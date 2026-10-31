// Practice material and quick links. Static on purpose: edit the two lists below.

import { openUrl } from "./open.js";

const BOOKS = "file:///Users/tanishkyadav/Documents/SecondBrain/GitHub";

const ART = "https://claude.ai/artifact/";

// Everything you still reach for, grouped by what you are doing. Edit freely.
const LIBRARY = [
  {
    heading: "Practice",
    items: [
      { title: "Quant Dojo", sub: "Adaptive practice: probability, statistics, quant finance", badge: "Artifact", url: `${ART}8McuMGKU5HN2LLHY7XbTEy` },
      { title: "Quant Dojo book", sub: "20 chapters that go with the practice site", badge: "PDF", url: `${BOOKS}/quant-dojo/book/Quant-Dojo.pdf` },
      { title: "Quant Interview Handbook", sub: "Mental math, probability, trading games, brainteasers, with solutions", badge: "PDF", url: `${BOOKS}/quant-interview-handbook/Quant-Interview-Handbook.pdf` },
      { title: "Trexquant QR Prep", sub: "Prep for the Trexquant QR role", badge: "Artifact", url: `${ART}Lft59a5W2UDPregDUuCw9r` },
    ],
  },
  {
    heading: "Thesis and capstone",
    items: [
      { title: "Doom Loop Thesis Status", sub: "Status of the MS thesis", badge: "Artifact", url: `${ART}BntKDr9K9oCAswtr7BM7hS` },
      { title: "Doom Loop Research Tree", sub: "The research questions, mapped as a tree", badge: "Artifact", url: `${ART}GftXrwF1RjM2wHbWM1TVd8` },
      { title: "Bond_Sim Architecture", sub: "Current state of the engine behind the thesis", badge: "Artifact", url: `${ART}2EwsQwY6HRgVCe2DR511uN` },
    ],
  },
  {
    heading: "Job search",
    into: "jobs-reference",
    items: [
      { title: "Quant Job Search Master Profile", sub: "Source of truth for the search", badge: "Artifact", url: `${ART}CRhPkvP1DsjcKceRBe5Fwe` },
    ],
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
  const box = document.getElementById("library-note");
  box.replaceChildren(el("span", null, message), ...actions);
  box.hidden = false;
}

function tile(item) {
  const li = el("li");
  const a = el("a", "tile");
  a.href = item.url;
  const text = el("div", "row-main");
  text.append(el("span", "row-title", item.title), el("span", "row-sub", item.sub));
  a.append(text, el("span", `tag ${item.badge === "PDF" ? "tag-quiet" : "tag-rose"}`, item.badge));
  a.addEventListener("click", (event) => {
    event.preventDefault();
    openUrl(item.url, { onProblem: problem });
  });
  li.append(a);
  return li;
}

export function initLinks() {
  const groups = LIBRARY.filter((group) => !group.into);
  document.getElementById("library").replaceChildren(
    ...groups.map((group) => {
      const col = el("div", "lib-col");
      const list = el("ul", "tiles");
      list.append(...group.items.map(tile));
      col.append(el("h3", "section", group.heading), list);
      return col;
    }),
  );
  // Groups that belong inside another card render there instead.
  for (const group of LIBRARY.filter((g) => g.into)) {
    document.getElementById(group.into)?.replaceChildren(...group.items.map(tile));
  }

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

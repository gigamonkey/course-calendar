import { Calendar } from "./calendar.js";
import { outline, units } from "./syllabus.js";

const loadData = async (calendar, syllabus) => {
  fillTable(await toCalendar(fetch(calendar)), await toOutline(fetch(syllabus, { cache: "no-cache" })));
};

const jsonOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.json();
};

const textOrBarf = (r) => {
  if (!r.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return r.text();
};

const toCalendar = (fetched) => fetched.then(jsonOrBarf).then((x) => new Calendar(x));

const toOutline = (fetched) => fetched.then(textOrBarf).then((x) => outline(x));

const fillTable = (calendar, outline) => {
  const weeks = [...calendar.elements];

  units(outline).forEach((unit) => {
    let tbody = document.createElement("tbody");

    let toFill = [];
    let count = 0;
    while (count < unit.weeks) {
      const w = weeks.shift();
      if (w.isWeek) count++;
      toFill.push(w);
    }

    const lessons = [...unit.children];

    let first = true;
    toFill.forEach((e, i) => {
      if (e.isWeek) {
        if (first) {
          tbody.appendChild(unitRow(unit));
        }
        tbody.appendChild(weekRow(e, calendar, lessons));
        first = false;
      } else {
        if (tbody.children.length > 0) {
          document.getElementById("table").appendChild(tbody);
          tbody = document.createElement("tbody");
        }
        tbody.appendChild(vacationRow(e));
        document.getElementById("table").appendChild(tbody);
        tbody = document.createElement("tbody");
      }
    });

    if (lessons.length > 0) {
      alert(`Overflow in unit ${unit.number}: ${JSON.stringify(lessons)}`);
    }
    document.getElementById("table").appendChild(tbody);
  });

  const { schoolWeeks, schoolDays } = calendar;

  document.getElementById("length").innerText = `${schoolWeeks} school weeks; ${schoolDays} school days`;
};

const spacerRow = () => {
  const tr = document.createElement("tr");
  tr.setAttribute("class", "spacer");
  return tr;
};

const unitRow = (unit) => {
  const tr = document.createElement("tr");
  tr.setAttribute("class", "unit");
  tr.appendChild(td(`Unit ${unit.number}: ${unit.title}`, { colspan: "6" }));
  return tr;
};

const weekRow = (w, calendar, lessons) => {
  const tr = document.createElement("tr");

  tr.appendChild(dateCell(w));

  if (w.start.dayOfWeek == 2) dayOff(tr);

  let days = w.days.length;

  while (days > 0 && lessons.length > 0) {
    const item = lessons.shift();
    const consumed = Math.min(days, item.days);

    if (item.title) {
      scheduled(tr, item, consumed);
    } else {
      unscheduled(tr, consumed);
    }
    if (consumed < item.days) {
      lessons.unshift(Object.assign(item, { days: item.days - consumed }));
    }
    days -= consumed;
  }
  if (days > 0) unscheduled(tr, days);
  if (w.end.dayOfWeek == 4) dayOff(tr);
  return tr;
};

const dateCell = (w) => {
  if (w.isAP) {
    const cell = td("", { class: "week" });
    cell.innerHTML = w.datesOfWeek() + "<br><span class='extra'>AP exams</span>";
    return cell;
  } else {
    return td(w.datesOfWeek(), { class: "week" });
  }
};

const dayOff = (tr) => {
  tr.appendChild(td("No school", { class: "off" }));
};

const scheduled = (tr, item, days) => {
  const c = "scheduled" + ("type" in item ? ` ${item.type}` : "");
  tr.appendChild(td(item.title, { class: c, colspan: days }));
};

const unscheduled = (tr, days) => {
  tr.appendChild(td("Unscheduled", { class: "unscheduled", colspan: days }));
};

const vacationRow = (v) => {
  const tr = document.createElement("tr");
  tr.setAttribute("class", "vacation");
  tr.appendChild(td(v.vacationString(), { colspan: "6" }));
  return tr;
};

const td = (text, attributes) => {
  const e = document.createElement("td");
  e.innerText = text;
  for (const name in attributes) {
    e.setAttribute(name, attributes[name]);
  }
  return e;
};

loadData("calendar.json", "outline.txt");

function showPage(page) {
  document.querySelectorAll('#converter, #culture, #festivals, #communities')
    .forEach(section => section.classList.add('hidden'));

  const target = document.getElementById(page);
  if (target) target.classList.remove('hidden');

  if (page === 'converter') renderCalendarGrid();
  if (page === 'festivals') renderFestivals(festivalSearch ? festivalSearch.value : '');
  if (page === 'communities') {
    renderCommunities(communitySearch ? communitySearch.value : '');
    closeCommunityProfile();
  }
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function convertDate() {
  const input = document.getElementById('chosenDate').value;
  const result = document.getElementById('result');

  if (!input) {
    result.textContent = 'Please select a date first.';
    return;
  }

  const date = new Date(input + 'T12:00:00');
  if (isNaN(date.getTime())) {
    result.textContent = 'Please choose a valid date.';
    return;
  }

  const monthDay = input.slice(5);
  const observances = UbochiObservances[monthDay] || [];
  const history = UbochiHistory[monthDay] || [];

  result.replaceChildren();

  const heading = document.createElement('h3');
  heading.textContent = date.toDateString();
  result.appendChild(heading);

  const market = document.createElement('p');
  market.textContent = 'Igbo market day: ' + getMarketDay(input);
  result.appendChild(market);

  appendFestivalDetails(result, getFestivalsForDate(input));

  const obsHeading = document.createElement('h4');
  obsHeading.textContent = 'National Observances & Special Days';
  result.appendChild(obsHeading);

  if (observances.length) {
    observances.forEach(item => {
      const title = document.createElement('p');
      title.textContent = item.title + ' (' + item.type + ')';
      result.appendChild(title);

      const description = document.createElement('p');
      description.textContent = item.description;
      result.appendChild(description);
    });
  } else {
    const none = document.createElement('p');
    none.textContent = 'No observance has been added for this date yet.';
    result.appendChild(none);
  }

  const historyHeading = document.createElement('h4');
  historyHeading.textContent = 'On This Day in History';
  result.appendChild(historyHeading);

  if (history.length) {
    history.forEach(item => {
      const title = document.createElement('p');
      title.textContent = item.year + ' — ' + item.title;
      result.appendChild(title);

      const description = document.createElement('p');
      description.textContent = item.description;
      result.appendChild(description);
    });
  } else {
    const none = document.createElement('p');
    none.textContent = 'Historical events for this date will be added as the archive grows.';
    result.appendChild(none);
  }
}

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function changeMonth(amount) {
  calendarMonth += amount;

  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  } else if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }

  renderCalendarGrid();
}

function renderCalendarGrid() {
  const grid = document.getElementById('calendar-grid');
  const heading = document.getElementById('calendar-month');

  if (!grid || !heading) return;

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  heading.textContent = new Date(calendarYear, calendarMonth, 1)
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  grid.replaceChildren();

  for (let blank = 0; blank < firstDay; blank++) {
    const spacer = document.createElement('div');
    spacer.className = 'calendar-empty';
    spacer.setAttribute('aria-hidden', 'true');
    grid.appendChild(spacer);
  }

  const todayString = localDateString(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(calendarYear, calendarMonth, day, 12);
    const dateString = localDateString(date);
    const monthDay = dateString.slice(5);
    const observances = UbochiObservances[monthDay] || [];
    const marketDay = getMarketDay(dateString);

    const festivals = getFestivalsForDate(dateString);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.setAttribute('aria-label',
      date.toDateString() + ', market day ' + marketDay +
      (observances.length ? ', ' + observances.map(item => item.title).join(', ') : ''));

    if (dateString === todayString) button.classList.add('is-today');
    if (observances.length) button.classList.add('has-observance');

    if (festivals.length) button.classList.add('has-festival');

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = day;
    button.appendChild(number);

    if (festivals.length) {
      const marker = document.createElement('span');
      marker.className = 'festival-day-marker';
      marker.textContent = 'Festival';
      button.appendChild(marker);
    }

    const market = document.createElement('span');
    market.className = 'day-market';
    market.textContent = marketDay;
    button.appendChild(market);

    if (observances.length) {
      const marker = document.createElement('span');
      marker.className = 'observance-dot';
      marker.textContent = '●';
      marker.setAttribute('aria-hidden', 'true');
      button.appendChild(marker);
      button.title = observances.map(item => item.title).join(', ');
    }

    button.addEventListener('click', () => {
      document.getElementById('chosenDate').value = dateString;
      convertDate();
    });

    grid.appendChild(button);
  }
}

function renderFestivals(searchTerm = '') {
  const list = document.getElementById('festival-list');
  if (!list) return;

  list.replaceChildren();
  const term = searchTerm.trim().toLocaleLowerCase();

  const matches = UbochiFestivals.filter(festival =>
    [festival.name, festival.localName, festival.community,
     festival.region, festival.category]
      .some(value => value.toLocaleLowerCase().includes(term))
  );

  if (!matches.length) {
    const message = document.createElement('p');
    message.textContent = 'No matching festivals found. Try another name or community.';
    list.appendChild(message);
    return;
  }

  matches.forEach(festival => {
    const card = document.createElement('article');
    card.className = 'festival-card';

    const title = document.createElement('h3');
    title.textContent = festival.name;
    card.appendChild(title);

    const community = document.createElement('p');
    community.className = 'festival-community';
    community.textContent = festival.community + ' • ' + festival.region;
    card.appendChild(community);

    const category = document.createElement('p');
    category.textContent = 'Category: ' + festival.category;
    card.appendChild(category);

    const date = document.createElement('p');
    date.textContent = 'Usual date: ' + festival.usualDate;
    card.appendChild(date);

    const status = document.createElement('p');
    status.className = 'festival-status';
    status.textContent = festival.dateStatus;
    card.appendChild(status);

    const description = document.createElement('p');
    description.textContent = festival.description;
    card.appendChild(description);

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Explore cultural details';
    details.appendChild(summary);

    if (festival.activities && festival.activities.length) {
      const heading = document.createElement('p');
      heading.textContent = 'Recorded activities:';
      details.appendChild(heading);

      const activityList = document.createElement('ul');
      festival.activities.forEach(activity => {
        const item = document.createElement('li');
        item.textContent = activity;
        activityList.appendChild(item);
      });
      details.appendChild(activityList);
    } else {
      const pending = document.createElement('p');
      pending.textContent = 'Ceremonies and activities will be added after confirmation from the community.';
      details.appendChild(pending);
    }

    const verification = document.createElement('p');
    verification.className = 'festival-status';
    verification.textContent = 'Research note: ' + festival.verification;
    details.appendChild(verification);

    card.appendChild(details);
    list.appendChild(card);
  });
}

function showHome() {
  document.querySelectorAll('#converter, #culture, #festivals, #communities')
    .forEach(section => section.classList.add('hidden'));

  const profile = document.getElementById('community-profile');
  if (profile) profile.classList.add('hidden');

  document.querySelector('.welcome')?.scrollIntoView({ behavior: 'smooth' });
}

const festivalSearch = document.getElementById('festival-search');
if (festivalSearch) {
  festivalSearch.addEventListener('input', () => {
    renderFestivals(festivalSearch.value);
  });
}

const today = new Date();
const todayString = localDateString(today);

document.getElementById('today').textContent =
  today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

document.getElementById('market').textContent = getMarketDay(todayString);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(error => console.error('Offline setup failed:', error));
  });
}


function renderCommunities(searchTerm = "") {
  const list = document.getElementById("community-list");
  if (!list || typeof UbochiCommunities === "undefined") return;

  const term = searchTerm.trim().toLocaleLowerCase();
  const matches = UbochiCommunities.filter(community =>
    [community.name, community.state, community.zone, community.description]
      .some(value => String(value || "").toLocaleLowerCase().includes(term))
  );

  list.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.textContent = "No matching communities found.";
    list.appendChild(empty);
    return;
  }

  matches.forEach(community => {
    const card = document.createElement("article");
    card.className = "community-card";

    const title = document.createElement("h3");
    title.textContent = community.name;

    const location = document.createElement("p");
    location.className = "community-location";
    location.textContent = community.state + " · " + community.zone;

    const description = document.createElement("p");
    description.textContent = community.description;

    const status = document.createElement("small");
    status.textContent = community.status;

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "community-open-button";
    openButton.textContent = "Explore community";
    openButton.addEventListener("click", () => showCommunityProfile(community.id));

    card.append(title, location, description, status, openButton);
    list.appendChild(card);
  });
}

const communitySearch = document.getElementById("community-search");
if (communitySearch) {
  communitySearch.addEventListener("input", () => {
    renderCommunities(communitySearch.value);
  });
}


function closeCommunityProfile() {
  const panel = document.getElementById("community-profile");
  if (!panel) return;
  panel.classList.add("hidden");
  panel.replaceChildren();
}

function showCommunityProfile(communityId) {
  const panel = document.getElementById("community-profile");
  if (!panel || typeof UbochiCommunities === "undefined") return;

  const community = UbochiCommunities.find(item => item.id === communityId);
  if (!community) return;

  panel.replaceChildren();
  panel.classList.remove("hidden");

  const back = document.createElement("button");
  back.type = "button";
  back.className = "community-back-button";
  back.textContent = "← Back to communities";
  back.addEventListener("click", closeCommunityProfile);

  const heading = document.createElement("h2");
  heading.textContent = community.name;

  const location = document.createElement("p");
  location.textContent = community.state + " · " + community.zone;

  const description = document.createElement("p");
  description.textContent = community.description;

  const heading2 = document.createElement("h3");
  heading2.textContent = "Cultural record";

  const note = document.createElement("p");
  note.textContent =
    "Local market days, festivals, language notes, and history can be added here after confirmation from community members and cultural custodians.";

  const status = document.createElement("p");
  status.className = "community-verification";
  status.textContent = "Record status: " + community.status;

  const marketHeading = document.createElement("h3");
  marketHeading.textContent = "Market-day tradition";

  const marketNote = document.createElement("p");
  marketNote.textContent =
    "Market-day cycles can differ by community. This profile does not assume a universal cycle; a local reference date is needed before calculating dates.";

  panel.append(back, heading, location, description, heading2, note,
               marketHeading, marketNote, status);
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function getFestivalsForDate(dateString) {
  if (typeof UbochiFestivals === "undefined") return [];

  const selectedMonthDay = dateString.slice(5);

  return UbochiFestivals.filter(festival => {
    if (!festival.calendarDate) return false;
    if (festival.calendarDateStatus !== "confirmed") return false;
    return festival.calendarDate === selectedMonthDay;
  });
}

function appendFestivalDetails(container, festivals) {
  if (!festivals.length) return;

  const heading = document.createElement("h4");
  heading.textContent = "Community Festivals & Cultural Events";
  container.appendChild(heading);

  festivals.forEach(festival => {
    const title = document.createElement("p");
    title.className = "calendar-festival-title";
    title.textContent = festival.name + " — " + festival.community;
    container.appendChild(title);

    const note = document.createElement("p");
    note.textContent = festival.description;
    container.appendChild(note);

    const status = document.createElement("small");
    status.textContent = festival.dateStatus || "Date status not recorded";
    container.appendChild(status);
  });
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
      <label class="color-scheme">
        Theme:
        <select>
          <option value="light dark">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    `
);


let pages = [
  { url: 'index.html', title: 'Introduction' },
  { url: 'scroll_animation/index.html', title: 'Drug Explanation' },
  { url: 'bloodpressure/index.html', title: 'Blood Pressure' },
  { url: 'takeaway/takeaway.html', title: 'Takeaway Insights' }
];
const ARE_WE_HOME = document.documentElement.classList.contains('home');


let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
  let url = p.url;
  let title = p.title;
  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;


  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }
  nav.append(a);
}

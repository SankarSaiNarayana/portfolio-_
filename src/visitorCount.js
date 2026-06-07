/** Global portfolio visit counter (countapi.mileshilliard.com — no API key). */
const COUNTER_KEY = 'yadlapalli-sankar-portfolio-visits';
const HIT_URL = `https://countapi.mileshilliard.com/api/v1/hit/${COUNTER_KEY}`;
const GET_URL = `https://countapi.mileshilliard.com/api/v1/get/${COUNTER_KEY}`;
const SESSION_KEY = 'portfolio-visit-recorded';

function formatCount(n) {
  return Number(n).toLocaleString('en-IN');
}

export async function initVisitorCount() {
  const root = document.getElementById('visitor-stat');
  const countEl = document.getElementById('visitor-count');
  if (!root || !countEl) return;

  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const hitRes = await fetch(HIT_URL, { method: 'GET', mode: 'cors' });
      if (!hitRes.ok) throw new Error('hit failed');
      sessionStorage.setItem(SESSION_KEY, '1');
    }

    const getRes = await fetch(GET_URL, { method: 'GET', mode: 'cors' });
    if (!getRes.ok) throw new Error('get failed');

    const data = await getRes.json();
    if (typeof data?.value !== 'number') throw new Error('invalid payload');

    countEl.textContent = formatCount(data.value);
    root.hidden = false;
    root.classList.add('is-loaded');
  } catch {
    root.remove();
  }
}

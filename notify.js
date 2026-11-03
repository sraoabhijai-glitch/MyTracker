/* Shared by the page (index.html) and the service worker (sw.js). */
(function (g) {
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const LBL = { todo: 'To-do', career: 'Career' };
  const done = t => t.status === 'Done';
  const defaults = () => ({
    time: '09:00',
    todo: { end: true, today: true, prio: true, status: true },
    career: { end: true, today: true, prio: true, status: true }
  });
  const list = a => { const s = a.slice(0, 3).map(t => t.task).join(', '); return a.length > 3 ? s + ' +' + (a.length - 3) + ' more' : s; };

  function build(data, now) {
    const n = (data.cfg && data.cfg.notify) || defaults();
    const d = iso(now), tm = iso(new Date(now.getTime() + 864e5)), hm = now.toTimeString().slice(0, 5);
    if (hm < n.time) return [];
    const out = [], hi = data.cfg.priority[0];
    for (const k of ['todo', 'career']) {
      const c = n[k] || {}, all = data[k] || [], open = all.filter(t => !done(t));
      const push = (kind, title, body) => out.push({ key: k + '-' + kind + '-' + d, title: LBL[k] + ' · ' + title, body, tag: 'tracker-' + k + '-' + kind });
      const todays = all.filter(t => (!t.start || t.start <= d) && (!t.end || t.end >= d));
      if (c.end) {
        const a = open.filter(t => t.end === d), b = open.filter(t => t.end === tm), o = open.filter(t => t.end && t.end < d);
        if (a.length) push('due', 'Due today', list(a));
        if (b.length) push('tmr', 'Due tomorrow', list(b));
        if (o.length) push('over', 'Overdue', list(o));
      }
      if (c.today && todays.length) {
        const p = todays.filter(t => !done(t));
        push('today', todays.length + ' task' + (todays.length > 1 ? 's' : '') + ' today', p.length ? list(p) : 'All done 🎉');
      }
      if (c.prio) {
        const a = open.filter(t => t.priority === hi);
        if (a.length) push('prio', hi + ' priority pending', list(a));
      }
      if (c.status) {
        const dn = todays.filter(done).length, pe = open.filter(t => todays.includes(t) || (t.end && t.end < d)).length;
        if (dn + pe > 0) push('status', 'Status', dn + ' completed · ' + pe + ' pending');
      }
    }
    return out;
  }

  const cacheGet = async n => { try { const r = await (await caches.open('tracker-data')).match(n); return r ? await r.json() : null; } catch (e) { return null; } };
  const cachePut = async (n, v) => { try { await (await caches.open('tracker-data')).put(n, new Response(JSON.stringify(v))); } catch (e) { } };
  const opts = x => ({ body: x.body, tag: x.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './' } });

  async function run(data, show) {
    const sent = (await cacheGet('sent.json')) || {}, now = new Date(), d = iso(now);
    for (const x of build(data, now)) { if (sent[x.key]) continue; sent[x.key] = 1; await show(x); }
    for (const k in sent) if (!k.endsWith(d)) delete sent[k];
    await cachePut('sent.json', sent);
  }

  /* ---- page-side helpers ---- */
  const granted = () => 'Notification' in g && Notification.permission === 'granted';
  const reg = async () => (g.navigator && navigator.serviceWorker) ? navigator.serviceWorker.getRegistration() : null;
  const snapshot = S => cachePut('data.json', S);

  async function check(getS) {
    if (!granted()) return;
    const r = await reg(); if (!r) return;
    await run(getS(), x => r.showNotification(x.title, opts(x)));
  }
  async function test() {
    const r = await reg();
    if (!r || !granted()) return alert('Enable notifications first. The app must be served over HTTPS.');
    r.showNotification('Tracker 🔔', { body: 'Notifications are working!', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
  }
  async function completed(k, t, S) {
    if (!granted() || !S.cfg.notify[k].status) return;
    const r = await reg(); if (!r) return;
    r.showNotification(LBL[k] + ' · Task completed 🎉', { body: t.task, tag: 'tracker-done-' + t.id, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
  }
  async function registerSync() {
    try {
      const r = await navigator.serviceWorker.ready;
      if ('periodicSync' in r) await r.periodicSync.register('tracker-check', { minInterval: 3600e3 });
    } catch (e) { }
  }
  function start(getS) {
    snapshot(getS());
    const go = () => check(getS);
    go(); setInterval(go, 60000);
    if (navigator.serviceWorker) navigator.serviceWorker.ready.then(() => { go(); registerSync(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  }

  /* ---- service-worker-side ---- */
  async function backgroundCheck() {
    const data = await cacheGet('data.json');
    if (data) await run(data, x => g.registration.showNotification(x.title, opts(x)));
  }

  g.TN = { defaults, build, run, snapshot, check, test, completed, registerSync, start, backgroundCheck };
})(self);

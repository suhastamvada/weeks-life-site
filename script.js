// Client-side weeks-of-life calculator and renderer.
// All work happens in the browser; no network or server calls.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('life-form');
  const birthInput = document.getElementById('birthdate');
  const expectancyInput = document.getElementById('expectancy');
  const endInput = document.getElementById('enddate');
  const summary = document.getElementById('summary-text');
  const statsRow = document.getElementById('stats-row');
  const grid = document.getElementById('weeks-grid');

  const DAY_MS = 86_400_000;
  const numberFmt = new Intl.NumberFormat('en-US');
  const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const parseDateInput = (value) => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if ([y, m, d].some(Number.isNaN)) return null;
    const date = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const toInputDate = (date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const stripTime = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  const addYears = (date, years) => {
    const clone = stripTime(date);
    clone.setUTCFullYear(clone.getUTCFullYear() + years);
    return clone;
  };

  const completedWeeks = (start, end) => {
    const days = Math.floor((end - start) / DAY_MS);
    if (days <= 0) return 0;
    return Math.floor(days / 7);
  };

  const totalWeeksSpan = (start, end) => {
    const days = Math.max(0, Math.ceil((end - start) / DAY_MS));
    return Math.max(1, Math.ceil(days / 7));
  };

  const chooseGrid = (total) => {
    if (total <= 0) return { cols: 1, rows: 1 };
    const ideal = Math.max(1, Math.floor(Math.sqrt(total)));
    const cols = Math.max(1, ideal + Math.floor(ideal / 6)); // slight width bias
    const rows = Math.ceil(total / cols);
    return { cols, rows };
  };

  const renderPlaceholder = (text) => {
    if (!grid || !summary || !statsRow) return;
    grid.classList.add('placeholder');
    grid.style.gridTemplateColumns = '';
    grid.innerHTML = `<p class="placeholder-text">${text}</p>`;
    summary.textContent = text;
    statsRow.innerHTML = '';
    grid.setAttribute('aria-label', 'Weeks grid placeholder');
  };

  const computeTimeline = (birthDate, endDate, today = new Date()) => {
    const start = stripTime(birthDate);
    const finish = stripTime(endDate);
    const now = stripTime(today);

    if (finish <= start) {
      throw new Error('End date must be after birth date.');
    }

    const total = totalWeeksSpan(start, finish);
    const lived = Math.min(total - 1, Math.max(0, completedWeeks(start, now)));
    const currentIndex = Math.min(total - 1, lived);
    const remaining = Math.max(0, total - lived - 1);

    return { total, lived, remaining, currentIndex };
  };

  const renderGrid = (stats, layout) => {
    if (!grid) return;
    const fragment = document.createDocumentFragment();

    for (let idx = 0; idx < stats.total; idx += 1) {
      const cell = document.createElement('div');
      cell.classList.add('week');
      if (idx === stats.currentIndex) {
        cell.classList.add('current');
        cell.setAttribute('aria-label', `Current week (${idx + 1} of ${stats.total})`);
      } else if (idx < stats.lived) {
        cell.classList.add('lived');
      } else {
        cell.classList.add('remaining');
      }
      fragment.appendChild(cell);
    }

    grid.classList.remove('placeholder');
    grid.style.gridTemplateColumns = `repeat(${layout.cols}, var(--cell-size))`;
    grid.innerHTML = '';
    grid.appendChild(fragment);
    grid.setAttribute('aria-label', `Weeks grid laid out as ${layout.cols} columns by ${layout.rows} rows.`);
  };

  const updateSummary = (stats, layout, birthDate, endDate) => {
    if (!summary || !statsRow) return;
    summary.textContent = `${dateFmt.format(birthDate)} → ${dateFmt.format(endDate)} · ${numberFmt.format(stats.total)} total weeks.`;
    statsRow.innerHTML = [
      `<span><strong>${numberFmt.format(stats.lived)}</strong> lived</span>`,
      `<span><strong>1</strong> current</span>`,
      `<span><strong>${numberFmt.format(stats.remaining)}</strong> remaining</span>`,
      `<span>${layout.cols} × ${layout.rows} grid</span>`
    ].join(' • ');
  };

  const renderVisualization = ({ announce = true, suppressErrors = false } = {}) => {
    if (!birthInput || !expectancyInput || !summary || !grid) return;

    const birthVal = birthInput.value;
    const expectancyVal = expectancyInput.value;
    const endVal = endInput?.value;

    if (!birthVal) {
      if (!suppressErrors) renderPlaceholder('Enter your birth date to see the grid.');
      return;
    }

    const birthDate = parseDateInput(birthVal);
    if (!birthDate) {
      if (!suppressErrors) renderPlaceholder('Birth date is invalid.');
      return;
    }

    let endDate = null;
    if (endVal) {
      endDate = parseDateInput(endVal);
      if (!endDate) {
        if (!suppressErrors) renderPlaceholder('End date is invalid.');
        return;
      }
    }

    let expectancyYears = parseInt(expectancyVal || '0', 10);
    if (Number.isNaN(expectancyYears) || expectancyYears <= 0) {
      expectancyYears = 90;
    }

    if (!endDate) {
      endDate = addYears(birthDate, expectancyYears);
    }

    try {
      const stats = computeTimeline(birthDate, endDate, new Date());
      const layout = chooseGrid(stats.total);
      renderGrid(stats, layout);
      updateSummary(stats, layout, birthDate, endDate);
      if (announce) {
        summary.focus?.();
      }
    } catch (err) {
      if (!suppressErrors) renderPlaceholder(err.message);
    }
  };

  // Hook up interactions for quick feedback.
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    renderVisualization({ announce: true });
  });

  ['input', 'change'].forEach((evt) => {
    form?.addEventListener(evt, () => renderVisualization({ announce: false, suppressErrors: true }));
  });

  // Seed defaults so the grid renders immediately for design tweaks.
  if (birthInput && !birthInput.value) {
    const approxThirtyYearsAgo = stripTime(new Date());
    approxThirtyYearsAgo.setUTCFullYear(approxThirtyYearsAgo.getUTCFullYear() - 30);
    birthInput.value = toInputDate(approxThirtyYearsAgo);
  }

  renderVisualization({ announce: false, suppressErrors: true });
});

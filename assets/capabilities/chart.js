(function (root) {
  'use strict';

  function isElement(node) {
    return !!node && typeof node === 'object' && node.nodeType === 1;
  }

  function buildTable(doc, columns, rows, ariaLabel) {
    const table = doc.createElement('table');
    table.className = 'cb-visually-hidden';
    const caption = doc.createElement('caption');
    caption.textContent = ariaLabel;
    table.appendChild(caption);

    const thead = doc.createElement('thead');
    const headRow = doc.createElement('tr');
    for (const col of columns) {
      const th = doc.createElement('th');
      th.scope = 'col';
      th.textContent = String(col);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = doc.createElement('tbody');
    for (const row of rows) {
      const tr = doc.createElement('tr');
      const cells = Array.isArray(row) ? row : columns.map((c) => (row ? row[c] : undefined));
      for (const cell of cells) {
        const td = doc.createElement('td');
        td.textContent = cell == null ? '' : String(cell);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function chart(host, options, ctx) {
    if (!isElement(host)) throw new Error('chart requires a host element to mount into');
    if (typeof root.echarts === 'undefined') throw new Error('chart requires ECharts to be loaded');

    const opts = options || {};
    const option = opts.option;
    const data = opts.data || {};
    const ariaLabel = opts.ariaLabel;

    if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) {
      throw new Error('chart requires data.columns and data.rows to be arrays');
    }
    if (typeof ariaLabel !== 'string' || ariaLabel.trim() === '') {
      throw new Error('chart requires a non-empty ariaLabel');
    }

    const doc = host.ownerDocument || root.document;
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', ariaLabel);

    let optionSource = option;
    const resolve = () =>
      typeof optionSource === 'function' ? optionSource({ theme: ctx.theme.current().semantic }) : optionSource;

    const instance = root.echarts.init(host);
    instance.setOption(resolve());

    const table = buildTable(doc, data.columns, data.rows, ariaLabel);
    host.appendChild(table);

    const unsubscribe = ctx.theme.onChange(function () {
      instance.setOption(resolve(), true);
    });

    return {
      instance,
      update(next) {
        if (next !== undefined) optionSource = next;
        instance.setOption(resolve());
        ctx.recordAction('chart', 'update');
      },
      resize() {
        instance.resize();
        ctx.recordAction('chart', 'resize');
      },
      dispose() {
        unsubscribe();
        instance.dispose();
        if (table.parentNode) table.parentNode.removeChild(table);
        ctx.recordAction('chart', 'dispose');
      },
    };
  }

  function register() {
    root.CB.register('chart', chart);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = chart;
  else if (root.CB) register();
  else if (typeof root.addEventListener === 'function') root.addEventListener('cookiebite:core-ready', register);
}(typeof globalThis !== 'undefined' ? globalThis : this));

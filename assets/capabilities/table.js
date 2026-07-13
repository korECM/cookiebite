(function (root) {
  'use strict';

  var collator = new Intl.Collator(undefined, { numeric: false, sensitivity: 'base' });

  function cellText(row, col) {
    var cell = row.cells[col];
    return cell ? cell.textContent.trim() : '';
  }

  function sortable(table, options, ctx) {
    if (!table || String(table.tagName).toUpperCase() !== 'TABLE') {
      throw new TypeError('sortable: expected a <table> element');
    }
    var tbody = table.tBodies[0];
    if (!tbody || tbody.rows.length === 0) {
      throw new Error('sortable: table has no <tbody> rows');
    }

    var opts = options || {};
    var numeric = {};
    (opts.numericColumns || []).forEach(function (i) { numeric[i] = true; });

    var headRow = table.tHead && table.tHead.rows[0];
    var headers = headRow ? Array.prototype.slice.call(headRow.cells) : [];
    var originalRows = Array.prototype.slice.call(tbody.rows);
    var buttons = [];
    var state = { col: -1, dir: 'asc' };

    // Compare two rows on a column. NaN cells always sort last, unaffected by direction.
    function compare(a, b, col, dir) {
      var av = cellText(a, col);
      var bv = cellText(b, col);
      var c;
      if (numeric[col]) {
        var an = parseFloat(av);
        var bn = parseFloat(bv);
        var aBad = Number.isNaN(an);
        var bBad = Number.isNaN(bn);
        if (aBad || bBad) return aBad && bBad ? 0 : (aBad ? 1 : -1);
        c = an < bn ? -1 : an > bn ? 1 : 0;
      } else {
        c = collator.compare(av, bv);
      }
      return dir === 'desc' ? -c : c;
    }

    function sortBy(col) {
      state.dir = col === state.col ? (state.dir === 'asc' ? 'desc' : 'asc') : 'asc';
      state.col = col;

      var rows = Array.prototype.slice.call(tbody.rows);
      var decorated = rows.map(function (row, i) { return { row: row, i: i }; });
      decorated.sort(function (a, b) {
        return compare(a.row, b.row, col, state.dir) || (a.i - b.i); // stable tie-break
      });
      decorated.forEach(function (d) { tbody.appendChild(d.row); }); // moves real nodes

      headers.forEach(function (th, i) {
        if (i === col) th.setAttribute('aria-sort', state.dir === 'asc' ? 'ascending' : 'descending');
        else th.removeAttribute('aria-sort');
      });

      ctx.recordAction('table', 'sort');
    }

    headers.forEach(function (th, col) {
      var button = th.ownerDocument.createElement('button');
      button.type = 'button';
      button.className = 'cb-sort';
      while (th.firstChild) button.appendChild(th.firstChild); // wrap existing header text
      th.appendChild(button);
      button.addEventListener('click', function () { sortBy(col); });
      buttons.push(button);
    });

    return {
      dispose: function () {
        headers.forEach(function (th, i) {
          var button = buttons[i];
          if (button) {
            while (button.firstChild) th.insertBefore(button.firstChild, button);
            button.remove();
          }
          th.removeAttribute('aria-sort');
        });
        originalRows.forEach(function (row) { tbody.appendChild(row); }); // restore order
      },
    };
  }

  function register() { root.CB.register('table', sortable); }

  if (typeof module !== 'undefined' && module.exports) module.exports = sortable;
  else if (root.CB) register();
  else if (typeof root.addEventListener === 'function') root.addEventListener('cookiebite:core-ready', register);
}(typeof globalThis !== 'undefined' ? globalThis : this));

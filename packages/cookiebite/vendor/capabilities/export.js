(function (root) {
  'use strict';

  function isElement(node) {
    return !!node && typeof node === 'object' && node.nodeType === 1;
  }

  function themeCss(ctx) {
    const theme = ctx.theme.current();
    return (theme && theme.css) || '';
  }

  function buildDocument(region, css) {
    return (
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      css +
      '</style></head><body>' +
      region.outerHTML +
      '</body></html>'
    );
  }

  function runPrint(region, ctx) {
    if (typeof root.open !== 'function') {
      throw new Error('export print requires window.open, which is unavailable');
    }
    const win = root.open('', '_blank');
    if (!win) {
      throw new Error('export print could not open a window (popup blocked?)');
    }
    win.document.open();
    win.document.write(buildDocument(region, themeCss(ctx)));
    win.document.close();
    win.print();
    ctx.recordAction('export', 'run');
    return win;
  }

  function runHtml(region, ctx) {
    const html = buildDocument(region, themeCss(ctx));
    const doc = region.ownerDocument || root.document;
    const blob = new root.Blob([html], { type: 'text/html' });
    const url = root.URL.createObjectURL(blob);
    const anchor = doc.createElement('a');
    anchor.href = url;
    anchor.download = 'export.html';
    doc.body.appendChild(anchor);
    anchor.click();
    doc.body.removeChild(anchor);
    root.URL.revokeObjectURL(url);
    ctx.recordAction('export', 'run');
    return html;
  }

  function exportRegion(region, options, ctx) {
    if (!isElement(region)) throw new Error('export requires an element region to export');
    const opts = options || {};
    const format = opts.format;
    if (format !== 'print' && format !== 'html') {
      throw new Error("export requires format to be 'print' or 'html'");
    }

    return {
      run() {
        return format === 'print' ? runPrint(region, ctx) : runHtml(region, ctx);
      },
      dispose() {
        region = null;
      },
    };
  }

  function register() {
    root.CB.register('export', exportRegion);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = exportRegion;
  else if (root.CB) register();
  else if (typeof root.addEventListener === 'function') root.addEventListener('cookiebite:core-ready', register);
}(typeof globalThis !== 'undefined' ? globalThis : this));

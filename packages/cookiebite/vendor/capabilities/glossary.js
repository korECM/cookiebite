(function (root) {
  'use strict';

  function isElement(node) {
    return !!node && typeof node === 'object' && node.nodeType === 1;
  }

  let idSeq = 0;

  function glossary(term, options, ctx) {
    if (!isElement(term)) throw new Error('glossary requires a term element to enhance');
    const opts = options || {};
    const definition = opts.definition;
    if (typeof definition !== 'string' || definition.trim() === '') {
      throw new Error('glossary requires a non-empty definition');
    }

    const doc = term.ownerDocument || root.document;
    const win = doc.defaultView || root;

    // Build the popover once, append to body (never wrap the term).
    const pop = doc.createElement('div');
    pop.className = 'cb-glossary-def';
    pop.setAttribute('role', 'tooltip');
    pop.hidden = true;
    pop.id = 'cb-glossary-def-' + (idSeq += 1);
    pop.textContent = definition;
    doc.body.appendChild(pop);

    // Enhance the term in place.
    const addedTabindex = !term.hasAttribute('tabindex');
    if (addedTabindex) term.setAttribute('tabindex', '0');
    term.setAttribute('aria-describedby', pop.id);

    let open = false;

    function position() {
      const r = term.getBoundingClientRect();
      pop.style.left = (r.left + win.scrollX) + 'px';
      pop.style.top = (r.bottom + win.scrollY) + 'px';
    }

    function show() {
      if (open) return;
      open = true;
      position();
      pop.hidden = false;
      ctx.recordAction('glossary', 'open');
    }

    function hide() {
      if (!open) return;
      open = false;
      pop.hidden = true;
      ctx.recordAction('glossary', 'close');
    }

    function onKeydown(e) {
      if (e.key === 'Escape') hide();
    }

    function onDocPointer(e) {
      if (!open) return;
      const t = e.target;
      if (t !== term && !term.contains(t) && t !== pop && !pop.contains(t)) hide();
    }

    term.addEventListener('focus', show);
    term.addEventListener('focusin', show);
    term.addEventListener('click', show);
    term.addEventListener('blur', hide);
    term.addEventListener('focusout', hide);
    term.addEventListener('keydown', onKeydown);
    doc.addEventListener('click', onDocPointer, true);

    return {
      dispose() {
        term.removeEventListener('focus', show);
        term.removeEventListener('focusin', show);
        term.removeEventListener('click', show);
        term.removeEventListener('blur', hide);
        term.removeEventListener('focusout', hide);
        term.removeEventListener('keydown', onKeydown);
        doc.removeEventListener('click', onDocPointer, true);
        if (pop.parentNode) pop.parentNode.removeChild(pop);
        term.removeAttribute('aria-describedby');
        if (addedTabindex) term.removeAttribute('tabindex');
        ctx.recordAction('glossary', 'dispose');
      },
    };
  }

  function register() {
    root.CB.register('glossary', glossary);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = glossary;
  else if (root.CB) register();
  else if (typeof root.addEventListener === 'function') root.addEventListener('cookiebite:core-ready', register);
}(typeof globalThis !== 'undefined' ? globalThis : this));

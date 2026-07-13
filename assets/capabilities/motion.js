(function (root) {
  'use strict';

  function isElement(node) {
    return !!node && typeof node === 'object' && node.nodeType === 1;
  }

  var DEFAULT_TIMING = { duration: 300, easing: 'ease', fill: 'both' };

  function normalize(play) {
    // Shape 1: author function (target) => Animation. Shape 2: bare keyframes
    // array. Shape 3: { keyframes, options }.
    if (typeof play === 'function') return { fn: play };
    if (Array.isArray(play)) return { keyframes: play, options: DEFAULT_TIMING };
    if (play && typeof play === 'object' && Array.isArray(play.keyframes)) {
      var options = play.options && typeof play.options === 'object' ? play.options : DEFAULT_TIMING;
      return { keyframes: play.keyframes, options: options };
    }
    return {};
  }

  function prefersReduced(win) {
    return typeof win.matchMedia === 'function' &&
      win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function applyFinalState(target, keyframes) {
    // Jump to the last keyframe so reduced-motion users get the resolved layout.
    var last = keyframes[keyframes.length - 1];
    for (var prop in last) {
      if (!Object.prototype.hasOwnProperty.call(last, prop)) continue;
      if (prop === 'offset' || prop === 'easing' || prop === 'composite') continue;
      target.style[prop] = last[prop];
    }
  }

  function motion(target, options, ctx) {
    if (!isElement(target)) throw new Error('motion requires a target element to animate');

    var play = options ? options.play : undefined;
    var spec = normalize(play);
    if (!spec.fn && (!spec.keyframes || spec.keyframes.length === 0)) {
      throw new Error('motion requires a play function or a non-empty keyframes array');
    }

    var win = (target.ownerDocument && target.ownerDocument.defaultView) || root;
    var animation = null;
    var disposed = false;

    function cancelInFlight() {
      if (animation) {
        try { animation.cancel(); } catch (err) { /* already finished */ }
        animation = null;
      }
    }

    var handle = {
      play: function play() {
        if (disposed) throw new Error('motion handle is disposed');
        cancelInFlight();
        ctx.recordAction('motion', 'play');

        if (prefersReduced(win)) {
          if (spec.fn) {
            // Let the authored function run, then jump to its end state.
            animation = spec.fn(target);
            if (animation && typeof animation.finish === 'function') animation.finish();
            return animation || { finished: Promise.resolve() };
          }
          applyFinalState(target, spec.keyframes);
          animation = null;
          return { finished: Promise.resolve() };
        }

        animation = spec.fn ? spec.fn(target) : target.animate(spec.keyframes, spec.options);
        return animation;
      },
      cancel: function cancel() {
        cancelInFlight();
        ctx.recordAction('motion', 'cancel');
      },
      dispose: function dispose() {
        cancelInFlight();
        disposed = true;
        target = null;
      },
    };

    return handle;
  }

  function register() {
    root.CB.register('motion', motion);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = motion;
  else if (root.CB) register();
  else if (typeof root.addEventListener === 'function') root.addEventListener('cookiebite:core-ready', register);
}(typeof globalThis !== 'undefined' ? globalThis : this));

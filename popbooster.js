(function () {
  const ECHO_DELAY_MIN = 150;
  const ECHO_DELAY_MAX = 300;
  const EVENT_CHAIN = ['pointerdown', 'mousedown', 'touchstart', 'mouseup', 'touchend', 'click'];

  let triggerLayer = null;
  let primaryGestureCaptured = false;
  let echoScheduled = false;
  let initExecuted = false;

  function randomDelay() {
    return ECHO_DELAY_MIN + Math.random() * (ECHO_DELAY_MAX - ECHO_DELAY_MIN);
  }

  function injectTriggerLayer() {
    if (triggerLayer && triggerLayer.isConnected) return triggerLayer;

    const layer = document.createElement('button');
    layer.type = 'button';
    layer.id = 'mtg-pop-booster-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.tabIndex = -1;

    const style = layer.style;
    style.position = 'fixed';
    style.width = '1px';
    style.height = '1px';
    style.top = '0';
    style.left = '0';
    style.opacity = '0';
    style.pointerEvents = 'auto';
    style.zIndex = '2147483647';
    style.background = 'transparent';

    layer.addEventListener('click', () => {});

    document.body.appendChild(layer);
    triggerLayer = layer;
    return layer;
  }

  function dispatchSyntheticGesture(type, target) {
    try {
      if (type.startsWith('touch')) {
        const touchInit = { identifier: Date.now(), target, clientX: 1, clientY: 1, pageX: 1, pageY: 1, screenX: 1, screenY: 1 };
        const touch = new Touch(touchInit);
        const touchEvent = new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
        });
        target.dispatchEvent(touchEvent);
      } else {
        const mouseEvent = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: 1,
          clientY: 1,
          screenX: 1,
          screenY: 1,
          view: window,
        });
        target.dispatchEvent(mouseEvent);
      }
    } catch (error) {
      const fallback = new Event(type, { bubbles: true, cancelable: true, composed: true });
      target.dispatchEvent(fallback);
    }
  }

  function emitGestureBurst(sourceType) {
    const layer = injectTriggerLayer();
    EVENT_CHAIN.forEach(type => dispatchSyntheticGesture(type, layer));

    if (!echoScheduled) {
      echoScheduled = true;
      setTimeout(() => {
        EVENT_CHAIN.forEach(type => dispatchSyntheticGesture(type, layer));
      }, randomDelay());
    }
  }

  function handleGesture(type) {
    if (primaryGestureCaptured) return;
    primaryGestureCaptured = true;
    emitGestureBurst(type);
  }

  function registerUserGesture() {
    const events = ['click', 'mousedown', 'touchstart'];
    events.forEach(eventName => {
      document.addEventListener(
        eventName,
        () => handleGesture(eventName),
        { capture: true }
      );
    });
  }

  function setupScrollTrigger() {
    window.addEventListener(
      'scroll',
      () => handleGesture('scroll'),
      { passive: true, once: true }
    );
  }

  function setupTouchTrigger() {
    window.addEventListener(
      'touchstart',
      () => handleGesture('touchstart'),
      { passive: true, once: true }
    );
  }

  function initPopBooster() {
    if (initExecuted) return;
    initExecuted = true;

    const start = () => {
      injectTriggerLayer();
      registerUserGesture();
      setupScrollTrigger();
      setupTouchTrigger();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  window.initPopBooster = initPopBooster;
  window.registerUserGesture = registerUserGesture;
  window.injectTriggerLayer = injectTriggerLayer;
  window.setupScrollTrigger = setupScrollTrigger;
  window.setupTouchTrigger = setupTouchTrigger;

  initPopBooster();
})();

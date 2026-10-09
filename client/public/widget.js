/*
 * Embeddable voice widget. Add to any website:
 *   <script src="https://YOUR-HOST/widget.js" defer></script>
 * Optional:  data-persona="support"  data-label="Talk to us"
 */
(function () {
  var script = document.currentScript;
  var origin = new URL(script.src).origin;
  var persona = script.getAttribute('data-persona') || 'assistant';
  var label = script.getAttribute('data-label') || 'Talk to AI';

  var button = document.createElement('button');
  button.textContent = '🎙 ' + label;
  button.setAttribute('aria-label', label);
  button.style.cssText =
    'position:fixed;right:20px;bottom:20px;z-index:2147483646;padding:12px 18px;border:0;border-radius:999px;' +
    'background:#6d5efc;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)';

  var frame = document.createElement('iframe');
  frame.src = origin + '/embed?persona=' + encodeURIComponent(persona);
  frame.allow = 'microphone';
  frame.title = label;
  frame.style.cssText =
    'position:fixed;right:20px;bottom:76px;width:360px;height:520px;max-height:80vh;border:0;border-radius:16px;' +
    'z-index:2147483646;display:none;box-shadow:0 12px 40px rgba(0,0,0,.35)';

  button.onclick = function () {
    frame.style.display = frame.style.display === 'none' ? 'block' : 'none';
  };

  document.body.appendChild(frame);
  document.body.appendChild(button);
})();

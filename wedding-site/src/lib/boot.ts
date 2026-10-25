// The admin CSP (src/proxy.ts) allows this script by its hash, computed from
// this string, so editing it needs no other change.
// Runs before paint: enables reveal states only when JavaScript runs, and
// shows everything anyway if the app has not hydrated within three seconds.
// mo = motion allowed (JavaScript, no ?static, no reduced-motion preference).
// land = the page opens somewhere other than the top (a #hash, a reload or
// back/forward): reveals stay visible until RevealObserver has shown what is
// already on screen, so a hash landing never flashes empty blocks.
export const bootScript = `(function(){var d=document.documentElement,c=d.classList;c.add('js');var s=/[?&]static\\b/.test(location.search);if(s)c.add('static');if(!s&&matchMedia('(prefers-reduced-motion: no-preference)').matches)c.add('mo');var n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];if(location.hash||(n&&n.type!=='navigate'))c.add('land');setTimeout(function(){if(!window.__revealReady)c.remove('js','mo','land')},3000)})();`;

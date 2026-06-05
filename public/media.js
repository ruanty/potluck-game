function renderMedia(media, opts = {}) {
  if (!media) return '';
  const autoplay = opts.autoplay ? 'autoplay' : '';
  const maxH = Number(opts.maxHeight || 64);
  const maxHeight = Number.isFinite(maxH) ? `${maxH / 4}rem` : '16rem';
  const style = `max-height:${maxHeight}`;
  const url = escapeMediaAttr(media.url || '');
  if (media.type === 'image') {
    return `<img src="${url}" class="rounded-xl shadow-lg max-w-full object-contain" style="${style}" alt="">`;
  } else if (media.type === 'audio') {
    return `<audio controls ${autoplay} class="w-full max-w-md"><source src="${url}"></audio>`;
  } else if (media.type === 'video') {
    return `<video controls ${autoplay} playsinline class="rounded-xl shadow-lg max-w-full" style="${style}"><source src="${url}"></video>`;
  }
  return '';
}

// Pause and unload any <audio>/<video> inside a container so removing it
// from the DOM reliably stops playback (some browsers keep audio going).
function stopMedia(container) {
  if (!container) return;
  container.querySelectorAll('audio, video').forEach(el => {
    try {
      el.pause();
      el.removeAttribute('src');
      el.querySelectorAll('source').forEach(s => s.removeAttribute('src'));
      el.load();
    } catch (e) { /* ignore */ }
  });
}

function escapeMediaAttr(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

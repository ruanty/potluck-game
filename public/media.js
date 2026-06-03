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

function escapeMediaAttr(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

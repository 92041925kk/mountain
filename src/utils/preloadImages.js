export function preloadImage(src, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }

    const image = new Image();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = src;
  });
}

export async function preloadImages(srcs, options = {}) {
  const timeoutMs = options.timeoutMs ?? 8000;
  const uniqueSrcs = [...new Set(srcs.filter(Boolean))];
  await Promise.all(uniqueSrcs.map((src) => preloadImage(src, timeoutMs)));
}

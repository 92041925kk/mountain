export function withTimeout(promise, ms = 8000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('連線逾時')), ms)
  );
  return Promise.race([promise, timeout]);
}

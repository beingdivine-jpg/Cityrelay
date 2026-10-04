/** A disclosed reading interval, never a simulated network or AI operation. */
export function waitForActivity(signal: AbortSignal, milliseconds: number) {
  signal.throwIfAborted();
  if (milliseconds <= 0) {
    // Yield a browser task even at full speed so React can commit each batch.
    // A message channel avoids background tabs' multi-second timer clamping.
    return new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel();
      const close = () => {
        channel.port1.close();
        channel.port2.close();
        signal.removeEventListener("abort", cancel);
      };
      const cancel = () => {
        close();
        reject(signal.reason);
      };
      channel.port1.onmessage = () => {
        close();
        resolve();
      };
      signal.addEventListener("abort", cancel, { once: true });
      channel.port2.postMessage(null);
    });
  }
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener("abort", cancel);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      reject(signal.reason);
    };
    signal.addEventListener("abort", cancel, { once: true });
  });
}

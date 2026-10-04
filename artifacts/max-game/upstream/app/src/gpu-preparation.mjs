import { withTimeout, yieldToBrowser } from "./asset-preparation.mjs";

// A fence waits asynchronously for submitted uploads/draws, without gl.finish().
export async function waitForGpu(gl) {
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!fence) throw new Error("GPU preparation fence unavailable");
  gl.flush();
  try {
    await withTimeout(async (signal) => {
      while (!signal.aborted) {
        if (gl.isContextLost()) throw new Error("WebGL context lost during preparation");
        const status = gl.clientWaitSync(fence, 0, 0);
        if (status === gl.WAIT_FAILED) throw new Error("GPU preparation failed");
        if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return;
        await yieldToBrowser();
      }
    }, 60000, "GPU preparation");
  } finally { gl.deleteSync(fence); }
}

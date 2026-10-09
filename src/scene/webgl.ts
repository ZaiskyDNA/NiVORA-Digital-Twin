/** Cek dini: dapatkah browser membuat konteks WebGL2 (dibutuhkan three.js r163+)? */
export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

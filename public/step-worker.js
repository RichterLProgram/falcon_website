/**
 * step-worker.js
 * Runs in a Web Worker — loads occt-import-js via importScripts (avoids
 * Node.js polyfill issues that crash when imported as an ES module).
 *
 * Protocol:
 *   main → worker:  { id, urls: [url1, url2] }
 *   worker → main:  { id, meshes: [ [{positions, normals, indices, color}, ...], ... ] }
 *   worker → main:  { id, error: string }
 */

/* eslint-disable no-restricted-globals */
self.importScripts('/occt-import-js.js');

let occtReady = null;

async function getOcct() {
  if (occtReady) return occtReady;
  // The UMD build exposes `occt_import_js` / `OcctImportJs` or similar
  // Try common global names
  const initFn =
    self.occt_import_js ||
    self.OcctImportJs ||
    self.occtImportJs ||
    (typeof Module !== 'undefined' ? Module : null);

  if (!initFn) throw new Error('occt-import-js global not found after importScripts');
  occtReady = await initFn({ locateFile: () => '/occt-import-js.wasm' });
  return occtReady;
}

async function parseStep(url, occt) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const result = occt.ReadStepFile(buf, null);
  if (!result?.meshes?.length) throw new Error(`No meshes parsed from ${url}`);

  return result.meshes.map(mesh => ({
    positions: Array.from(mesh.attributes.position.array),
    normals: mesh.attributes.normal ? Array.from(mesh.attributes.normal.array) : null,
    indices: mesh.index ? Array.from(mesh.index.array) : null,
    color: mesh.color ? [mesh.color[0], mesh.color[1], mesh.color[2]] : null,
  }));
}

self.onmessage = async (e) => {
  const { id, urls } = e.data;
  try {
    const occt = await getOcct();
    const results = await Promise.all(urls.map(url => parseStep(url, occt)));
    self.postMessage({ id, meshes: results });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};

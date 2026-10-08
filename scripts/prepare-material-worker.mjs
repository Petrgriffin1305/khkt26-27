import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function prepareMaterialWorker(projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const officeParserPackage = JSON.parse(await readFile(path.join(projectRoot, 'node_modules/officeparser/package.json'), 'utf8'));
  const pdfJsPackagePath = path.join(projectRoot, 'node_modules/pdfjs-dist/package.json');
  const pdfJsPackage = JSON.parse(await readFile(pdfJsPackagePath, 'utf8'));
  const expectedPdfJsVersion = officeParserPackage.dependencies?.['pdfjs-dist'];

  if (!expectedPdfJsVersion || pdfJsPackage.version !== expectedPdfJsVersion) {
    throw new Error(
      `PDF worker mismatch: officeparser expects pdfjs-dist ${expectedPdfJsVersion ?? '(unknown)'}, ` +
      `but ${pdfJsPackage.version ?? '(unknown)'} is installed.`,
    );
  }

  const workerSource = path.join(projectRoot, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
  const publicDirectory = path.join(projectRoot, 'public');
  const workerDestination = path.join(publicDirectory, 'pdf.worker.min.mjs');
  await mkdir(publicDirectory, { recursive: true });
  await copyFile(workerSource, workerDestination);
  return { workerDestination, version: pdfJsPackage.version };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { version } = await prepareMaterialWorker();
  console.log(`Prepared same-origin PDF.js worker (${version}) at public/pdf.worker.min.mjs`);
}

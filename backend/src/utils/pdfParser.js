const fs = require('fs');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = null;
}

async function extractTextFromPdf(filePath) {
  if (!pdfParse) {
    throw new Error('pdf-parse non installé. Exécutez: npm install pdf-parse');
  }
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

module.exports = { extractTextFromPdf };

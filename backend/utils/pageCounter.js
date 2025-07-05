// utils/pageCounter.js
const fs = require("fs");
const path = require("path");
const { file } = require("tmp-promise");
const { exec } = require("child_process");
const pdfParse = require("pdf-parse");

async function convertDocxToPdf(inputPath) {
  const outputDir = path.dirname(inputPath);
  return new Promise((resolve, reject) => {
    exec(
      `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`,
      (err, stdout, stderr) => {
        if (err) return reject(stderr);
        const pdfPath = inputPath.replace(/\.\w+$/, ".pdf");
        resolve(pdfPath);
      }
    );
  });
}

async function getPageCount(fileBuffer, mimetype) {
  if (mimetype === "application/pdf") {
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.numpages;
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
    mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation"  // .pptx
  ) {
    const tmpInput = await file({ postfix: path.extname(mimetype) === '.pptx' ? '.pptx' : '.docx' });
    fs.writeFileSync(tmpInput.path, fileBuffer);
    const pdfPath = await convertDocxToPdf(tmpInput.path);
    const pdfData = await pdfParse(fs.readFileSync(pdfPath));
    fs.unlinkSync(pdfPath); // cleanup
    return pdfData.numpages;
  }

  if (mimetype.startsWith("image/")) {
    return 1; // 1 page per image
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

module.exports = { getPageCount };

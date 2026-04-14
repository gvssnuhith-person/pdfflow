/**
 * Quick test script — tests all conversion endpoints.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:5000';
const TMP_DIR = path.join(__dirname, 'tmp');

// Ensure tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Upload a file to the convert endpoint.
 */
function uploadFile(filePath, filename, contentType) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const fileContent = fs.readFileSync(filePath);

    const preamble = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const postamble = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(preamble),
      fileContent,
      Buffer.from(postamble),
    ]);

    const url = new URL('/api/convert', API_BASE);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, body: buf });
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== PDF Converter API Tests ===\n');

  // Test 1: Health check
  console.log('1. Health Check...');
  try {
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const health = await healthRes.json();
    console.log(`   ✅ Status: ${health.status}, Uptime: ${health.uptime}s\n`);
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}\n`);
  }

  // Test 2: Formats
  console.log('2. Formats...');
  try {
    const fmtRes = await fetch(`${API_BASE}/api/formats`);
    const fmt = await fmtRes.json();
    console.log(`   ✅ Images: ${fmt.formats.images.join(', ')}`);
    console.log(`   ✅ Docs: ${fmt.formats.documents.join(', ')}`);
    console.log(`   ✅ Text: ${fmt.formats.text.join(', ')}`);
    console.log(`   ✅ Max size: ${fmt.maxFileSizeMB}MB\n`);
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}\n`);
  }

  // Test 3: Text → PDF
  console.log('3. Text → PDF...');
  const testTextFile = path.join(TMP_DIR, 'test.txt');
  fs.writeFileSync(testTextFile, 'Hello World!\nThis is a test document.\nLine 3 here.\n\nParagraph break.');
  try {
    const result = await uploadFile(testTextFile, 'test.txt', 'text/plain');
    if (result.status === 200) {
      const outPath = path.join(TMP_DIR, 'test_output.pdf');
      fs.writeFileSync(outPath, result.body);
      console.log(`   ✅ PDF created: ${result.body.length} bytes`);
      console.log(`   ✅ Duration: ${result.headers['x-conversion-duration']}`);
      console.log(`   ✅ Saved to: ${outPath}\n`);
    } else {
      const error = JSON.parse(result.body.toString());
      console.log(`   ❌ Error ${result.status}: ${error.error}\n`);
    }
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}\n`);
  }

  // Test 4: Empty file
  console.log('4. Empty file (should fail gracefully)...');
  const emptyFile = path.join(TMP_DIR, 'empty.txt');
  fs.writeFileSync(emptyFile, '');
  try {
    const result = await uploadFile(emptyFile, 'empty.txt', 'text/plain');
    if (result.status === 400) {
      const error = JSON.parse(result.body.toString());
      console.log(`   ✅ Correctly rejected: ${error.error}\n`);
    } else {
      console.log(`   ❌ Should have been rejected but got status ${result.status}\n`);
    }
  } catch (e) {
    console.log(`   ❌ Failed: ${e.message}\n`);
  }

  // Test 5: Test with DOCX file from Downloads (if available)
  console.log('5. DOCX → PDF...');
  const docxPath = 'C:\\Users\\GVS\\Downloads\\ML_2Mark_QA_AllUnits.docx';
  if (fs.existsSync(docxPath)) {
    try {
      const result = await uploadFile(
        docxPath,
        'ML_2Mark_QA_AllUnits.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      if (result.status === 200) {
        const outPath = path.join(TMP_DIR, 'docx_output.pdf');
        fs.writeFileSync(outPath, result.body);
        console.log(`   ✅ PDF created: ${result.body.length} bytes`);
        console.log(`   ✅ Duration: ${result.headers['x-conversion-duration']}`);
        console.log(`   ✅ Saved to: ${outPath}\n`);
      } else {
        const error = JSON.parse(result.body.toString());
        console.log(`   ❌ Error ${result.status}: ${error.error}\n`);
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}\n`);
    }
  } else {
    console.log('   ⏭️  Skipped (no DOCX file found)\n');
  }

  // Test 6: Image → PDF (test with a WhatsApp image from Downloads)
  console.log('6. Image → PDF...');
  const imgPath = 'C:\\Users\\GVS\\Downloads\\WhatsApp Image 2026-03-19 at 11.31.25 PM.jpeg';
  if (fs.existsSync(imgPath)) {
    try {
      const result = await uploadFile(imgPath, 'test_image.jpeg', 'image/jpeg');
      if (result.status === 200) {
        const outPath = path.join(TMP_DIR, 'image_output.pdf');
        fs.writeFileSync(outPath, result.body);
        console.log(`   ✅ PDF created: ${result.body.length} bytes`);
        console.log(`   ✅ Duration: ${result.headers['x-conversion-duration']}`);
        console.log(`   ✅ Saved to: ${outPath}\n`);
      } else {
        const error = JSON.parse(result.body.toString());
        console.log(`   ❌ Error ${result.status}: ${error.error}\n`);
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}\n`);
    }
  } else {
    console.log('   ⏭️  Skipped (no image file found)\n');
  }

  console.log('=== All tests complete ===');
}

runTests().catch(console.error);

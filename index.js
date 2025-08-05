import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import unzipper from 'unzipper';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zipUrl = 'https://github.com/PrinceXtremeX/MINI-BOT/archive/refs/heads/main.zip';
const zipPath = path.join(__dirname, 'bot.zip');
const extractPath = path.join(__dirname, 'MINI-BOT-main');
const mainScript = path.join(extractPath, 'index.js');

async function downloadZip(url, output) {
  return new Promise((resolve, reject) => {
    console.log('📥 Downloading bot ZIP file...');
    const file = fs.createWriteStream(output);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ZIP. Status Code: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(output, () => reject(err));
    });
  });
}

async function unzipFile(zipFile, destination) {
  console.log('📦 Extracting ZIP...');
  return fs.createReadStream(zipFile)
    .pipe(unzipper.Extract({ path: destination }))
    .promise();
}

function startBot() {
  if (!fs.existsSync(mainScript)) {
    console.error('❌ main.js not found inside the extracted ZIP.');
    return;
  }
  console.log('🚀 Starting the WhatsApp bot...');
  const botProcess = exec(`node ${mainScript}`);

  botProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  botProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  botProcess.on('exit', (code) => {
    console.log(`⚠️ Bot exited with code ${code}`);
  });
}

async function launch() {
  try {
    if (fs.existsSync(extractPath)) {
      console.log('♻️ Deleting old bot directory...');
      fs.rmSync(extractPath, { recursive: true, force: true });
    }

    await downloadZip(zipUrl, zipPath);
    await unzipFile(zipPath, __dirname);
    fs.unlinkSync(zipPath); // delete zip after extraction
    startBot();
  } catch (err) {
    console.error('❌ Failed to launch the bot:', err.message);
  }
}

launch();

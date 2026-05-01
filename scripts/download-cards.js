const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsDir = path.join(__dirname, '..', 'assets', 'cards');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];
const suits = ['S', 'D', 'C', 'H'];
const joker = ['X1'];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {});
        reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err.message);
    });
  });
};

async function main() {
  const allCards = [];
  
  for (const rank of ranks) {
    for (const suit of suits) {
      allCards.push(`${rank}${suit}`);
    }
  }
  allCards.push('X1'); // Joker

  let indexContent = `// Auto-generated file\nexport const CardImages: Record<string, any> = {\n`;

  console.log(`Downloading ${allCards.length} card images...`);

  for (const code of allCards) {
    const url = `https://deckofcardsapi.com/static/img/${code}.png`;
    const dest = path.join(assetsDir, `${code}.png`);
    
    try {
      if (!fs.existsSync(dest)) {
        await downloadFile(url, dest);
        console.log(`Downloaded ${code}.png`);
      } else {
        console.log(`Skipped ${code}.png (already exists)`);
      }
      indexContent += `  '${code}': require('./${code}.png'),\n`;
    } catch (err) {
      console.error(`Failed to download ${code}:`, err);
    }
  }

  indexContent += `};\n`;
  fs.writeFileSync(path.join(assetsDir, 'index.ts'), indexContent);
  console.log('Finished downloading cards and generated index.ts!');
}

main();

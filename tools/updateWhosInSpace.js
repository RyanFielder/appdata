const fs = require('fs');
const axios = require('axios');

async function main() {
    const url = 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json';
    const outputPath = 'whosinspace/people-in-space.json';

    try {
        const response = await axios.get(url);
        fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
        console.log(`File successfully downloaded and saved to ${outputPath}`);
    } catch (error) {
        console.error('Error downloading or saving the file:', error);
    }
}

main();
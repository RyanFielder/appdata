const androidVersions = require('android-versions');
const fs = require('fs');

// Use all available fields from the android-versions package
class AndroidApi {
    constructor(obj) {
        Object.assign(this, obj);
    }
}

function main() {
    const allVersions = Object.values(androidVersions)
        .filter(v => v && typeof v === 'object' && 'api' in v);
    const apiLevels = allVersions.map(v => {
        // Clone all properties, but format releaseDate as 'year' in MDY
        const obj = { ...v };
        if (obj.releaseDate) {
            obj.year = new Date(obj.releaseDate).getFullYear();
        } else {
            obj.year = 'TBD';
        }
        return new AndroidApi(obj);
    });
    fs.writeFileSync('devutils/androidApiVersions.json', JSON.stringify(apiLevels, null, 2));
    console.log(`Wrote ${apiLevels.length} Android API levels to androidApiVersions.json`);
}

main();

const androidVersions = require('android-versions');
const fs = require('fs');

class AndroidApi {
    constructor(obj) {
        Object.assign(this, obj);
    }
}

function main() {
    const allVersions = Object.values(androidVersions)
        .filter(v => v && typeof v === 'object' && 'api' in v);
    const apiLevels = allVersions.map(v => {
        const obj = { ...v };
        if (obj.releaseDate) {
            obj.year = new Date(obj.releaseDate).getFullYear();
        } else {
            obj.year = 'TBD';
        }
        return new AndroidApi(obj);
    });
    apiLevels.sort((a, b) => b.api - a.api);
    fs.writeFileSync('devutils/androidApiVersions.json', JSON.stringify(apiLevels, null, 2));
    console.log(`Wrote ${apiLevels.length} Android API levels to androidApiVersions.json`);
}

main();

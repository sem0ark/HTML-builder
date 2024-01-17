const fs = require('fs');

const path = require('path');

fs.createReadStream(path.join(__dirname, 'text.txt')).pipe(process.stdout);

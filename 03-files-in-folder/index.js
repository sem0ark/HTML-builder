const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdir(dir, (e, files) => {
    if (e) throw e;
    files.forEach((f) => {
      const p = path.join(dir, f);

      fs.stat(p, (e, s) => {
        if (s.isDirectory()) walk(p, cb);
        else if (s.isFile()) cb(p, s);
      });
    });
  });
}

walk(path.join(__dirname, 'secret-folder'), (p, s) => {
  const full_name = p.split(path.sep).at(-1);
  const splitted = full_name.split('.');
  const ext = splitted.pop();
  const name = splitted.join('.');

  console.log(`"${name}" - "${ext}" - ${(s.size / 1024).toPrecision(3)}kB`);
});

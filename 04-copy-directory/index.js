const fs = require('fs');
const path = require('path');

const from = 'files';
const to = 'files-copy';

const getAbsFrom = (p = '') => path.join(__dirname, from, p);
const getAbsTo = (p = '') => path.join(__dirname, to, p);

function walk(dir, cb_file, cb_dir) {
  fs.readdir(getAbsFrom(dir), (e, files) => {
    if (e) throw e;
    files.forEach((f) => {
      const p = path.join(dir, f);
      console.log(p);

      fs.stat(getAbsFrom(p), (e, s) => {
        if (s.isDirectory()) {
          cb_dir(p, () => walk(p, cb_file, cb_dir));
        } else if (s.isFile()) cb_file(p);
      });
    });
  });
}

function runCopy() {
  fs.mkdir(getAbsTo(), () =>
    walk(
      '',
      (p) =>
        fs
          .createReadStream(getAbsFrom(p))
          .pipe(fs.createWriteStream(getAbsTo(p))),
      (p, cb) => fs.mkdir(getAbsTo(p), cb),
    ),
  );
}

// trying to access the copy folder, if possible -> remove it to track deleted files.
fs.stat(getAbsTo(), (e) => {
  if (e) runCopy();
  else fs.rmdir(getAbsTo(), { recursive: true, force: true }, runCopy);
});

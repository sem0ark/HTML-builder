const fs = require('fs');
const path = require('path');

const { PassThrough } = require('stream');

// modified version of https://gist.github.com/lovasoa/8691344?permalink_comment_id=3299089#gistcomment-3299089
async function* walk_filtered(dir, condition = () => true) {
  for await (const d of await fs.promises.opendir(dir)) {
    const p = path.join(dir, d.name);

    if (d.isDirectory()) yield* walk_filtered(p);
    else if (d.isFile() && condition(p)) yield p;
  }
}

// modified https://stackoverflow.com/questions/16431163/concatenate-two-or-n-streams
function merge(streams) {
  let pass = new PassThrough();

  for (let i = 0; i < streams.length; i += 1) {
    pass = streams[i].pipe(pass, { end: i === streams.length - 1 });
  }

  return pass;
}

async function bundle() {
  const to = path.join(__dirname, 'project-dist', 'bundle.css');
  const from = path.join(__dirname, 'styles');
  const paths = [];

  for await (const p of walk_filtered(from, (p) => path.extname(p) === '.css'))
    paths.push(fs.createReadStream(p));

  merge(paths).pipe(fs.createWriteStream(to));
}

bundle();

const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');

function localPath(...ps) {
  return path.join(__dirname, 'test-files', ...ps);
}

function distPath(...ps) {
  return localPath('project-dist', ...ps);
}

// modified version of https://gist.github.com/lovasoa/8691344?permalink_comment_id=3299089#gistcomment-3299089
async function* walk(dir, yieldDir = false) {
  for await (const d of await fs.promises.opendir(dir)) {
    const p = path.join(dir, d.name);

    if (d.isDirectory()) {
      if (yieldDir) yield p;
      yield* walk(p);
    }
  }
}

function merge(streams) {
  let pass = new PassThrough();

  for (let i = 0; i < streams.length; i += 1) {
    pass = streams[i].pipe(pass, { end: i === streams.length - 1 });
  }

  return pass;
}

async function copyFolder(from, to) {
  try {
    await fs.promises.rmdir(to, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(to);
  }

  for await (const p of walk(from, true)) {
    const s = await fs.promises.stat(p);
    if (s.isDirectory()) fs.promises.mkdir(p);
    else {
      fs.createReadStream(p).pipe(
        fs.createWriteStream(path.join(to, path.basename(p))),
      );
    }
  }
}

async function bundleCSS(from, to) {
  const paths = [];

  for await (const p of walk(from))
    if (path.extname(p) === '.css') paths.push(fs.createReadStream(p));

  merge(paths).pipe(fs.createWriteStream(to));
}

async function prepareHTML(template, components, to) {
  const contents = await fs.promises.readFile(template);
  const componentContents = new Map();

  for await (const p of walk(components))
    if (path.extname(p) === '.html')
      componentContents[path.basename(p)] = fs.promises.readFile(p);

  await Promise.all(componentContents.values());

  await fs.promises.writeFile(
    to,
    contents.replace(
      /\{\{[a-zA-Z]\}\}/,
      (match, capture) => componentContents[capture],
    ),
  );
}

async function bundle() {
  const result_folder = distPath('');

  try {
    await fs.promises.rmdir(result_folder, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(result_folder);

    await Promise.all([
      prepareHTML(
        localPath('template.html'),
        localPath('components'),
        distPath('index.html'),
      ),
      bundleCSS(localPath('styles'), distPath('style.css')),
      copyFolder(localPath('assets'), distPath('project-dist', 'assets')),
    ]);
  }
}

bundle();

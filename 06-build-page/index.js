const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');

function localPath(...ps) {
  return path.join(__dirname, ...ps);
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
    } else if (d.isFile()) {
      yield p;
    }
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

async function copyFolder(from, to) {
  try {
    await fs.promises.rm(to, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(to);
  }

  for await (const p of walk(from, true)) {
    const s = await fs.promises.stat(p);
    const destination = p.replace(from, to);

    if (s.isDirectory()) {
      await fs.promises.mkdir(destination);
    } else {
      fs.createReadStream(p).pipe(fs.createWriteStream(destination));
    }
  }
}

async function bundleCSS(from, to) {
  const paths = [];

  for await (const p of walk(from)) paths.push(fs.createReadStream(p));

  await fs.promises.writeFile(to, merge(paths));
}

async function prepareHTML(template, components, to) {
  const contents = await fs.promises.readFile(template, 'utf-8');
  const componentContents = new Map();

  for await (const p of walk(components))
    if (path.extname(p) === '.html')
      componentContents.set(
        path.basename(p),
        await fs.promises.readFile(p, 'utf-8'), // blocking for simplicity, assuming the user uses all the components for the resulting file
      );

  await fs.promises.writeFile(
    to,
    contents.replaceAll(/\{\{([a-zA-Z]+)\}\}/g, (match, capture) =>
      componentContents.get(capture + '.html'),
    ),
  );
}

async function bundle() {
  const result_folder = distPath();

  try {
    await fs.promises.rm(result_folder, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(result_folder);

    await Promise.all([
      prepareHTML(
        localPath('template.html'),
        localPath('components'),
        distPath('index.html'),
      ),
      bundleCSS(localPath('styles'), distPath('style.css')),
      copyFolder(localPath('assets'), distPath('assets')),
    ]);
  }
}

bundle();

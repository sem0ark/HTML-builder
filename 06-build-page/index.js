const fs = require('fs');
const path = require('path');

function localPath(...ps) {
  return path.join(__dirname, ...ps);
}

// modified version of https://gist.github.com/lovasoa/8691344?permalink_comment_id=3299089#gistcomment-3299089
async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const p = path.join(dir, d.name);

    yield p;
    if (d.isDirectory()) yield* walk(p);
  }
}

async function copyFolder(from, to) {
  try {
    await fs.promises.rmdir(to, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(to);
  }

  for await (const p of walk(from)) {
    const s = await fs.promises.stat(p);
    if (s.isDirectory()) fs.promises.mkdir(p);
    else {
      fs.createReadStream(p).pipe(
        fs.createWriteStream(path.join(to, path.basename(p))),
      );
    }
  }
}

async function prepareHTML(template, components) {}

async function bundleCSS() {}

async function bundle() {
  const result_folder = localPath('project-dist');

  try {
    await fs.promises.rmdir(result_folder, { recursive: true, force: true });
  } finally {
    await fs.promises.mkdir(result_folder);

    await Promise.all([
      prepareHTML(localPath('template.html'), localPath('components')),
      bundleCSS(localPath('styles'), localPath('project-dist', 'style.css')),
      copyFolder(localPath('assets'), localPath('project-dist', 'assets')),
    ]);
  }
}

bundle();

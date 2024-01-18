const fs = require('fs');
const path = require('path');

function localPath(...ps) {
  return path.join(__dirname, ...ps);
}

// modified version of https://gist.github.com/lovasoa/8691344?permalink_comment_id=3299089#gistcomment-3299089
async function* walk_filtered(dir, condition = () => true) {
  for await (const d of await fs.promises.opendir(dir)) {
    const p = path.join(dir, d.name);

    if (d.isDirectory()) yield* walk_filtered(p);
    else if (d.isFile() && condition(p)) yield p;
  }
}

async function prepareHTML() {}

async function bundleCSS() {}

async function copyFolder() {}

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

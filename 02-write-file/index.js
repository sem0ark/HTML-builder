const fs = require('fs');
const path = require('path');

let exitHandled = false;

function handleExit() {
  if (exitHandled) return process.exit(0);

  exitHandled = true;
  process.stdout.write('Bye!');
  process.stdout.end();
  process.exit(0);
}

// catch ctrl-c, so that event 'exit' always works on windows
// https://gist.github.com/hyrious/30a878f6e6a057f09db87638567cb11a
process.on('SIGINT', handleExit);
process.on('exit', handleExit);

const output = fs.createWriteStream(
  path.resolve('.', '02-write-file', 'out.txt'),
);

process.stdin.on('data', (chunk) => {
  if (chunk.toString().trim() === 'exit') handleExit();
  else output.write(chunk);
});

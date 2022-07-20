const { exec } = require("child_process");

const exeAsync = async (cmd, onData = (d) => console.log(d)) => {
  return new Promise((resolve, reject) => {
    const p = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });

    p.stdout.on("data", onData);
  });
};

module.exports = exeAsync;

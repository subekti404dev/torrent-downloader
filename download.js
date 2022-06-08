const { exec } = require("child_process");
const kill = require("tree-kill");

const exeAsync = async (cmd) => {
  return new Promise((resolve, reject) => {
    const p = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });

    let lastProcess = null;
    p.stdout.on("data", (data) => {
      const arr = data?.split('\r')[1]?.split(",");
      if (data && data.includes("Progress") && arr.length > 0) {
        const progress = arr[0]?.replace("Progress: ", "")?.trim();
        const speed = arr[1]
          ?.split(" peers ")[1]
          ?.replace("(", "")
          ?.replace(")", "");
        let tmp = null;
        if (progress && speed)
          tmp = `Progress: ${progress}, DL Speed: ${speed}`;

        if (tmp !== lastProcess) console.log(tmp);
        lastProcess = tmp;

        if (progress === "100.0%" || data.includes("Seeding")) {
          console.log("FINISH", { pid: p.pid });
          kill(p.pid);
        }
      }
    });
  });
};

const main = async () => {
  try {
    const url = process.argv[2];
    let cmd = `transmission-cli ${url} -w /data`;
    console.log(`execute: `, cmd);
    await exeAsync(cmd);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

main();

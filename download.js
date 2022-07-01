const { exec } = require("child_process");
const kill = require("tree-kill");

const sendMqtt = (url, tmp) => {
  const msg = `${url}|||${tmp}`;
  exec(
    `mqtt pub -t urip_torrent_downloader -m "${msg}" -h broker.emqx.io -p 8083 -ws`
  );
};

const exeAsync = async (cmd, opts) => {
  const url = cmd.split(" ")[1];
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
      const arr = data?.split("\r")[1]?.split(",");
      if (data && data.includes("Progress") && arr.length > 0) {
        const progress = arr[0]?.replace("Progress: ", "")?.trim();
        const speed = arr[1]
          ?.split(" peers ")[1]
          ?.replace("(", "")
          ?.replace(")", "");
        let tmp = null;
        if (progress && speed)
          tmp = `Progress: ${progress}, DL Speed: ${speed}`;

        if (tmp !== lastProcess) {
          console.log(tmp);
          if (opts && opts.includes("mqtt")) {
            sendMqtt(url, tmp);
          }
        }
        lastProcess = tmp;

        if (progress === "100.0%" || data.includes("Seeding")) {
          if (opts && opts.includes("mqtt")) {
            sendMqtt(url, `Progress: 100%, DL Speed: 0`);
          }
          console.log("FINISH", { pid: p.pid });
          setTimeout(() => {
            kill(p.pid);
          }, 1000 * 10);
        }
      }
    });
  });
};

const main = async () => {
  try {
    const url = process.argv[2];
    const opts = process.argv[3];
    let cmd = `transmission-cli ${url} -w /data`;
    console.log(`execute: `, cmd);
    await exeAsync(cmd, opts);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

main();

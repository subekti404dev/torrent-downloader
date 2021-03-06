const { exec } = require("child_process");
const kill = require("tree-kill");

const sendMqtt = (url, tmp) => {
  const msg = `${url}|||${tmp}`;
  exec(
    `mosquitto_pub -h broker.emqx.io -t 'urip_torrent_downloader' -m '${msg}'`
  );
};

const exeAsync = async (cmd) => {
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
          sendMqtt(url, tmp);
        }
        lastProcess = tmp;

        if (progress === "100.0%" || data.includes("Seeding")) {
          sendMqtt(url, `Progress: 100%, DL Speed: 0`);
          console.log("FINISH", { pid: p.pid });
          setTimeout(() => {
            kill(p.pid);
          }, 1000 * 15);
        }
      }
    });
  });
};

const main = async (url) => {
  try {
    let cmd = `transmission-cli ${url} -w /data`;
    console.log(`execute: `, cmd);
    await exeAsync(cmd);
    sendMqtt(url, `Progress: 100%, DL Speed: 0`);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

module.exports = main;

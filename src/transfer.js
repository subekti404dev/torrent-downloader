require("dotenv").config();
const fs = require("fs");
const execAsync = require("./utils/exec-async");

const walk = async (dir, extentions) => {
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filepath = dir + "/" + file;
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) {
      walk(filepath, extentions);
    } else {
      const extention = file.split(".").pop();
      if (extentions.split(",").includes(extention)) {
        console.log("Uploading File: ", filepath);
        const filename =
          filepath.replace(/[^a-zA-Z0-9]/g, "_") + "." + extention;
        await execAsync(
          `curl --upload-file ${filepath} https://transfer.sh/${filename}`
        );
      }
    }
  }
};

const main = async (extentions = "mp4,mkv,mov,3gp") => {
  try {
    const filepath = "/data";
    console.log({ filepath });
    await walk(filepath, extentions);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

module.exports = main;

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
      const extension = file.split(".").pop();
      if (extentions.split(",").includes(extension)) {
        console.log("Uploading File: ", filepath);
        const filename =
        filepath.split("/").reverse()[0].replace(/[^a-zA-Z0-9]/g, "").replace(extension, "") + "." + extension;
        fs.copyFileSync(filepath, `/tmp/${filename}`);
        await execAsync(
          `curl -F "file=@/tmp/${filename}" "https://api.anonfiles.com/upload" | jq -r ".data.file.url.short" > /tmp/${filename}.url && cat /tmp/${filename}.url`
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

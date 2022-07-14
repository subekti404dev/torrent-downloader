require("dotenv").config();
const { getDrive, createDir, uploadFile } = require("./drive");
const fs = require("fs");
const delay = require("delay");
const drive = getDrive();
const delayTime = 1000 * 5;

const walk = async (dir, driveDirId) => {
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filepath = dir + "/" + file;
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) {
      console.log("Create Dir: ", filepath);
      await delay(delayTime);
      const newDir = await createDir(drive, file, driveDirId);
      await delay(delayTime);
      walk(filepath, newDir.id);
    } else {
      console.log("Upload File: ", filepath);
      await delay(delayTime);
      await uploadFile(drive, filepath, file, driveDirId);
      await delay(delayTime);
    }
  }
};

const main = async (driveParentId = process.env.GA_TMP_DRIVE_PARENT_ID) => {
  try {
    const filepath = "/data";
    console.log({ filepath });
    await walk(filepath, driveParentId);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

module.exports = main;

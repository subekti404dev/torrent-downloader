const fs = require("fs");
const path = require("path");

const findFiles = (dir = __dirname) => {
  let res = fs.readdirSync(dir).map((x) => path.join(dir, x));
  let files = res.filter((x) => fs.lstatSync(x).isFile());
  const folders = res.filter((x) => fs.lstatSync(x).isDirectory());

  for (const x of folders) {
    const f = findFiles(x);
    files = [...files, ...f];
  }
  return files;
};

const findVideos = async (dir = __dirname) => {
  const files = findFiles(dir);
  const videos = files.filter((x) =>
    ["mp4", "mkv", "avi", "webm", "flv", "mov", "m4v"].includes(
      x.split("/").reverse()[0].split(".").reverse()[0]
    )
  );
  return videos;
};

module.exports = {
  findVideos,
};

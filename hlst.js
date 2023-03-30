const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { findVideos } = require("./find-video");

const result = {
  360: 0,
  480: 0,
  720: 0,
  1080: 0,
};
let last_progress = 0;

const exec = require("child_process").exec;
const executeCMD = async (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout.trim() || stderr.trim());
    });
  });
};

const getOutputDir = (filePath) => {
  const filename = (filePath || "").split("/").reverse()?.[0];
  const filenameWithoutExt = (filename || "").split(".")?.[0];
  const outputBaseDir = filePath.replace(`/${filename}`, "");
  const outputDir = path.join(outputBaseDir, filenameWithoutExt);
  return outputDir;
};

const transcode = (filePath, size = 1080) => {
  let totalTime;
  const outputDir = path.join(getOutputDir(filePath), size.toString());

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    let video = ffmpeg(filePath, { timeout: 432000 });
    video.addOptions([
      "-profile:v baseline",
      "-level 3.0",
      "-start_number 0",
      "-hls_time 5",
      "-hls_list_size 0",
      "-f hls",
      //   `-hls_segment_filename '${path.join(outputDir, "segment_%03d.ts")}'`,
    ]);
    if (size) {
      video.size(`${size}x?`);
    }
    video.output(path.join(outputDir, `index.m3u8`));
    video
      .on("end", () => {
        return resolve(true);
        // process.exit(0);
      })
      .on("codecData", (data) => {
        totalTime = parseInt(data.duration.replace(/:/g, ""));
      })
      .on("progress", (progress) => {
        const time = parseInt(progress.timemark.replace(/:/g, ""));
        const percent = (time / totalTime) * 100;
        result[size] = percent;

        let total = (Object.values(result).reduce((tmp, v) => tmp + v, 0) / 4).toFixed(2);
        if (total > last_progress) {
          console.log(`[ progress ]: ${total}%`);
        }
        last_progress = total;
      })
      .on("error", (err) => {
        reject(err);
      });
    video.run();
  });
};

const generateMaster = async (filePath) => {
  const outputDir = getOutputDir(filePath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const masterFilePath = path.join(outputDir, "master.m3u8");

  const content = `
    #EXTM3U
    #EXT-X-VERSION:6
    #EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=480x360
    360/index.m3u8?key=pppp
    
    #EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x480
    480/index.m3u8?key=pppp
    
    #EXT-X-STREAM-INF:BANDWIDTH=750000,RESOLUTION=1280x720
    720/index.m3u8?key=pppp
    
    #EXT-X-STREAM-INF:BANDWIDTH=1125000,RESOLUTION=1920x1080
    1080/index.m3u8?key=pppp
  `
    .split("\n")
    .map((x) => x.trim())
    .join("\n");

  fs.writeFileSync(masterFilePath, content);
};

const main = async () => {
  try {
    const ffmpegPath = await executeCMD("which ffmpeg");
    if (ffmpegPath?.includes("not found") || !ffmpegPath) {
      throw new Error("ffmpeg not installed");
    }
    ffmpeg.setFfmpegPath(ffmpegPath);

    const videoPath = (await findVideos("/data"))?.[0];
    console.log(videoPath);
    const opt = process.argv[2];
    if (!videoPath) {
      throw new Error("video path is required");
    }
    console.log(`Generate HLS for: '${videoPath}'`);
    const promises = [generateMaster(videoPath)];
    const resolutions = [360, 480, 720, 1080];
    for (const r of resolutions) {
      promises.push(transcode(videoPath, r));
    }
    await Promise.all(promises);

    if (opt === "--rv") {
      fs.unlinkSync(videoPath);
    }
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

main();

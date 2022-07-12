const ConfigParser = require("configparser");
const axios = require("axios").default;
const fs = require("fs");

const config = new ConfigParser();

const main = async () => {
  try {
    const url = process.argv[2];
    const index = process.argv[3] || 0;
    const resp = await axios.get(url);
    const tmpName = ".tmp.conf";
    fs.writeFileSync(tmpName, resp.data);
    config.read(tmpName);
    fs.unlinkSync(tmpName);
    const sections = config.sections();
    const section = sections[index];
    let client_id = "202264815644.apps.googleusercontent.com";
    let client_secret = "4Z3ca8xfWDb1Voo-F9a7ZxJ";
    let redirect_uri = "http://127.0.0.1:53682";

    if (
      config.get(section, "client_id") &&
      config.get(section, "client_secret")
    ) {
      client_id = config.get(section, "client_id");
      client_secret = config.get(section, "client_secret");
      redirect_uri = "https://developers.google.com/oauthplayground";
    }

    let token;
    try {
      token = JSON.parse(config.get(section, "token"));
    } catch (error) {
      throw error;
    }
    const refresh_token = token?.refresh_token;

    const env = [
      "GA_DRIVE_CLIENT_ID=" + client_id,
      "GA_DRIVE_CLIENT_SECRET=" + client_secret,
      "GA_DRIVE_REDIRECT_URL=" + redirect_uri,
      "GA_DRIVE_REFRESH_TOKEN=" + refresh_token,
    ].join("\n");

    fs.writeFileSync(".env", env);
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

main();

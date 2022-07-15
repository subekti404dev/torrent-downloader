require("dotenv").config();
const downloadFunc = require('./src/download')
const getConfigFunc = require('./src/getconfig')
const uploadFunc = require('./src/upload')

const main = async () => {
  try {
    const [_,_a,action,...args] = process.argv;
    console.log({action, args});
    if (action === 'config') {
        await getConfigFunc(args[0], args[1])
    }
    if (action === 'download') {
        await downloadFunc(args[0])
    }
    if (action === 'upload') {
        await uploadFunc(args[0])
    }
  } catch (error) {
    console.log(error?.response?.data || error?.message);
  }
};

main();
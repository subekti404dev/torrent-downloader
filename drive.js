require('dotenv').config();
const { google } = require("googleapis");
const fs = require("fs");
const mime = require("mime-types");

const getDrive = () => {
    const client_id = process.env.GA_DRIVE_CLIENT_ID;
    const client_secret = process.env.GA_DRIVE_CLIENT_SECRET;
    const redirect_uri = process.env.GA_DRIVE_REDIRECT_URL;
    const refresh_token = process.env.GA_DRIVE_REFRESH_TOKEN;

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    oauth2Client.setCredentials({ refresh_token });
    return google.drive({ version: "v3", auth: oauth2Client });
}

const getFileList = async (drive, parentFolderId) => {
    const res = await drive.files.list({q:  `'${parentFolderId}' in parents and trashed = false`})
    return res?.data?.files || [];
}

const getDirList = async (drive, parentFolderId) => {
    const res = await drive.files.list({q:  `'${parentFolderId}' in parents and trashed = false`})
    return (res?.data?.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder');
}

const uploadFile = async (drive, filePath, filename, dirId) => {
    try {
        const mimeType = mime.lookup(filePath);
        const payload = {
            resource: {
                name: filename,
                mimeType,
            },
            media: {
                mimeType,
                body: fs.createReadStream(filePath),
            },
        };
        if (dirId) {
            payload.resource.parents = [dirId];
        };
        const response = await drive.files.create(payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}


const createDir = async (drive, name, parentFolderId = null) => {
    try {
        const option = {
            resource: {
                name,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        }
        if (parentFolderId) {
            option.resource['parents'] = [parentFolderId]
        }
        const response = await drive.files.create(option);
        return response.data;
    } catch (error) {
        throw error;
    }
}

const generatePublicUrl = async (drive, fileId) => {
    try {
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });
        const result = await drive.files.get({
            fileId,
            fields: "webViewLink, webContentLink",
        });
        return result.data;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getDrive,
    getFileList,
    getDirList,
    uploadFile,
    createDir,
    generatePublicUrl
}
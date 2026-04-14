const { Client, Storage, ID } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

const uploadFile = async (buffer, filename, mimeType) => {
  const file = await storage.createFile(
    process.env.APPWRITE_BUCKET_ID,
    ID.unique(),
    { buffer, name: filename, type: mimeType, size: buffer.length }
  );
  return file;
};

const getFileUrl = (fileId) => {
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
};

const deleteFile = async (fileId) => {
  await storage.deleteFile(process.env.APPWRITE_BUCKET_ID, fileId);
};

module.exports = { uploadFile, getFileUrl, deleteFile };

import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridfsBucket;

export const initGridFS = () => {
  const db = mongoose.connection.db;
  gridfsBucket = new GridFSBucket(db, {
    bucketName: "pdfs"
  });
  console.log("GridFS inicializado");
};

export const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error("GridFS no inicializado");
  }
  return gridfsBucket;
};
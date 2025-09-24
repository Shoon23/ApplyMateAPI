import multer from "multer";

const uploadMiddleware = multer({ storage: multer.memoryStorage() });

export default uploadMiddleware;

const multer = require('multer');

// Use memory storage so we can process the buffer directly
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'text/markdown',
    'application/octet-stream',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  const ext = (file.originalname || '').toLowerCase();
  const validExt = /\.(pdf|docx|doc|xlsx|xls|csv|txt|md|png|jpg|jpeg|webp)$/.test(ext);

  if (allowedMimeTypes.includes(file.mimetype) || validExt) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type: ${file.originalname}. Accepted formats: PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG.`),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

module.exports = upload;

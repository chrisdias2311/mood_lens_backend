var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var { PythonShell } = require('python-shell');
var admin = require('firebase-admin');

// Initialize Firebase
var serviceAccount = require('path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-firebase-storage-bucket-url'
});
var bucket = admin.storage().bucket();

var storage = multer.memoryStorage();
const upload = multer({storage:storage});

router.post('/emotion', upload.single('image'), function(req, res, next) {
  try {
    var file = req.file;
    var filename = Date.now() + path.extname(file.originalname);
    var fileUpload = bucket.file(filename);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error(error);
      res.status(500).json({ error: 'Error uploading file to Firebase Storage.' });
    });

    blobStream.on('finish', () => {
      var publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(fileUpload.name)}?alt=media`;

      // Configure the Python shell
      var options = {
        mode: 'text',
        pythonOptions: ['-u'], // unbuffered stdout
        scriptPath: 'routes/model/',
        args: [publicUrl]
      };

      // Run the Python script and get the output
      var pyshell = new PythonShell('predict_emotion.py', options);
      pyshell.on('message', function(message) {
        console.log(message);
        res.json({ emotion: message });
      });
      pyshell.end(function (err) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'An error occurred while running the prediction model.' });
        }
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.log(error)
  }
});

module.exports = router;

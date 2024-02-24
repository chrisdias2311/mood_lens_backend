// var express = require('express');
// var router = express.Router();
// var { PythonShell } = require('python-shell');

// router.post('/emotion', function(req, res, next) {
//   try {
//     var imageUrl = req.body.imageUrl;

//     // Configure the Python shell
//     var options = {
//       mode: 'text',
//       pythonOptions: ['-u'], // unbuffered stdout
//       scriptPath: 'models/',
//       args: [imageUrl]
//     };

//     // Run the Python script and get the output
//     var pyshell = new PythonShell('predict.py', options);

//     pyshell.on('message', function(message) {
//       console.log(message);
//       res.json({ emotion: message });
//     });

//     pyshell.end(function (err) {
//       if (err) {
//         console.error(err);
//         res.status(500).json({ error: 'An error occurred while running the prediction model.' });
//       }
//     });
//   } catch (error) {
//     console.log(error)
//   }
// });

// module.exports = router;










// API to predict single image emotion

// var express = require("express");
// var router = express.Router();
// var { PythonShell } = require("python-shell");

// router.post("/emotion", function (req, res, next) {
//   try {
//     var imageUrl = req.body.imageUrl;

//     // Configure the Python shell
//     var options = {
//       mode: "text",
//       pythonOptions: ["-u"], // unbuffered stdout
//       scriptPath: "models/",
//       args: [imageUrl],
//     };

//     // Run the Python script and get the output
//     var pyshell = new PythonShell("predict.py", options);
//     var emotion;

//     pyshell.on("message", function (message) {
//       console.log(message);
//       emotion = message; // Store the message in the emotion variable
//     });

//     pyshell.end(function (err) {
//       if (err) {
//         console.error(err);
//         res
//           .status(500)
//           .json({
//             error: "An error occurred while running the prediction model.",
//           });
//       } else {
//         res.json({ emotion: emotion }); // Send the response here
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const { PythonShell } = require('python-shell');

router.post("/emotion", function (req, res, next) {
  try {
    var imgUrls = req.body.imgUrls;
    var emotionsMap = new Map(); // Map to store emotions for each image

    // Function to predict emotion for a single image
    function predictEmotion(imageUrl, id) {
      return new Promise((resolve, reject) => {
        var options = {
          mode: "text",
          pythonOptions: ["-u"],
          scriptPath: "models/",
          args: [imageUrl],
        };
        var pyshell = new PythonShell("predict.py", options);
        
        pyshell.on("message", function (message) {
          if (!message.includes("[=")) { // Filter out progress messages
            emotionsMap.set(id, message); // Store emotion for this image in the map
          }
        });

        pyshell.end(function (err) {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // Iterate over each image URL and predict emotion
    var promises = imgUrls.map(({ id, imageUrl }) => predictEmotion(imageUrl, id));

    // Once all predictions are done, send response
    Promise.all(promises)
      .then(() => {
        // Convert map to array of objects
        var emotions = Array.from(emotionsMap, ([id, emotion]) => ({ id, emotion }));
        res.json({ imgUrls: emotions }); // Send the response with emotions for all images
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "An error occurred while running the prediction model." });
      });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

module.exports = router;



// https://firebasestorage.googleapis.com/v0/b/portal-8d197.appspot.com/o/onboard_hospital%2F-Ngy86nBlGlvPH5eODNh%2F1698142014810_watch1.jpg?alt=media&token=f2b6299f-ec82-4671-870d-dea3e4ad4340
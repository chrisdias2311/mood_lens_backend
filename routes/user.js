const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");

const MeetingReport = require("../schemas/MeetingReportsSchema");
const MeetingTimestamp = require("../schemas/MeetingTimestampsSchema");
const StudentReport = require("../schemas/StudentReportSchema");

const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');


// router.post("/signup", async (req, res) => {
//     const saltRounds = 10;
//     try {
//         const user = await User.findOne({ pid: req.body.pid });
//         if (user) return res.status(400).send("Account already exists");

//         // bcrypt encryption
//         bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
//             if (err) {
//                 console.log(err);
//                 res.status(500).send('Error generating hash');
//             } else {
//                 const newUser = new User({
//                     pid: req.body.pid,
//                     email: req.body.email,
//                     password: hash,
//                     disability: req.body.disability
//                 });

//                 // save user here
//                 newUser.save()
//                     .then(() => {
//                         console.log('User created');
//                         res.status(200).send(newUser);
//                     })
//                     .catch((err) => {
//                         console.log(err);
//                         res.status(500).send('Error saving user');
//                     });
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Server error');
//     }
// });



// router.post("/login", async (req, res) => {
//     try {
//         // find user by PID or email
//         const user = await User.findOne({ $or: [{ pid: req.body.pid }, { email: req.body.email }] });
//         if (!user) return res.status(400).send("Account does not exist");

//         // bcrypt password comparison
//         bcrypt.compare(req.body.password, user.password, (err, result) => {
//             if (err) {
//                 console.log(err);
//                 res.status(500).send('Error comparing passwords');
//             } else if (result) {
//                 console.log('User logged in');
//                 res.status(200).send(user);
//             } else {
//                 res.status(400).send('Incorrect password');
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Server error');
//     }
// });


// router.post("/face_id_signup", async (req, res) => {
//     try {
//         // Extract user details from request body
//         const { pid, userName, name, face_id, disability, phone } = req.body;
  
//         if (!pid || !userName || !phone) {
//             return res.status(400).send("Missing user details in request body");
//         }
  
//         // Convert userName to lowercase
//         const lowerCaseUsername = userName.toLowerCase();

//         // Create a new user
//         const user = new User({
//             pid: pid,
//             userName: lowerCaseUsername,
//             name: name,
//             face_id: face_id,
//             disability: disability,
//             phone: phone
//         });
  
//         // Save the user to the database
//         const savedUser = await user.save();
  
//         // Return success response with user information
//         res.status(200).json({ user: savedUser });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Internal server error");
//     }
// });


router.post("/signup", async (req, res) => {
    const saltRounds = 10;
    try {
        const user = await User.findOne({ pid: req.body.pid });
        if (user) return res.status(400).json({ message: "Account already exists", user: null });

        // bcrypt encryption
        bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Error generating hash', user: null });
            } else {
                const newUser = new User({
                    pid: req.body.pid,
                    userName: req.body.userName.toLowerCase(),
                    face_id: req.body.face_id,
                    disability: req.body.disability,
                    phone: req.body.phone,
                    email: req.body.email,
                    password: hash
                });

                // save user here
                newUser.save()
                    .then(() => {
                        console.log('User created');
                        res.status(200).json({ message: 'User created successfully', user: newUser });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).json({ message: 'Error creating user', user: null });
                    });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error', user: null });
    }
});


router.post("/login", async (req, res) => {
    try {
        // Extract image URL, username and password from request body
        const { imageUrl, username, password } = req.body;

        // Convert username to lowercase
        const lowerCaseUsername = username.toLowerCase();

        // Find the user with the given username
        const user = await User.findOne({ userName: lowerCaseUsername });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // If imageUrl is provided, use face ID for authentication
        if (imageUrl) {
            const similarity = await compareImages(imageUrl, user.face_id);
            if (similarity === "yes") {
                return res.status(200).json({ message: "Face ID matched", user });
            } else {
                return res.status(200).json({ message: "Face ID does not match" });
            }
        }

        // If password is provided, use password for authentication
        if (password) {
            bcrypt.compare(password, user.password, function(err, result) {
                if (result == true) {
                    return res.status(200).json({ message: "Logged In Successfully", user });
                } else {
                    return res.status(200).json({ message: "Incorrect password" });
                }
            });
        }

        // If neither imageUrl nor password is provided, return an error
        if (!imageUrl && !password) {
            return res.status(400).send("Missing image URL or password in request body");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});



// router.post("/login", async (req, res) => {
//     try {
//         // Extract username and pid from request body
//         const { username, pid } = req.body;

//         if (!username || !pid) {
//             return res.status(400).send("Missing username or pid in request body");
//         }

//         // Find the user with the given username and pid
//         const user = await User.findOne({ userName: username, pid: pid });
//         if (!user) {
//             return res.status(404).send("User not found");
//         }

//         // If the user is found, return the user information
//         res.status(200).json({ user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Internal server error");
//     }
// });





// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI("AIzaSyB0TW1vcbeM8a56Uo8GT0TBriUZgDCfwdE");

async function compareImages(imageUrl1, imageUrl2) {
    // Fetch image data asynchronously
    const [imageData1Response, imageData2Response] = await Promise.all([
        axios.get(imageUrl1, { responseType: 'arraybuffer' }),
        axios.get(imageUrl2, { responseType: 'arraybuffer' }),
    ]);

    const imageData1 = imageData1Response.data;
    const imageData2 = imageData2Response.data;

    // Convert image data to GenerativeAI.Part objects
    const imagePart1 = imageDataToGenerativePart(imageData1, "image/jpeg");
    const imagePart2 = imageDataToGenerativePart(imageData2, "image/jpeg");

    // Use gemini-pro-vision model for multimodal input
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prompt asking to compare the images
    const prompt = "Imagine that you are very Intelligent at matching faces. You will be given 2 images. You have to check if the person in buth the images is same or not. If the Person in both the images is same return yes. If you feel that any of the two Images is not real or the person in both the images is not the same person return No";

    // Generate content with prompt and both images
    const result = await model.generateContent([prompt, imagePart1, imagePart2]);
    const modelResponse = await result.response;
    const prediction = modelResponse.text();
    console.log(prediction)

    const outputArr = ["yes", "no"];
    const regex = new RegExp(outputArr.join("|"), "i");

    const trimmedLowercaseOutput = prediction.trim().toLowerCase();

    var finalOutput = trimmedLowercaseOutput;
    const match = trimmedLowercaseOutput.match(regex);
    if (match) {
        // If a match was found, it will be the first element in the 'match' array
        finalOutput = match[0];
        console.log("Final OP:", finalOutput);
    } else {
        finalOutput = "no";
        console.log("Final:", finalOutput);
    }

    // Return "similar" if prediction is "Yes", "different" otherwise
    return finalOutput;
}
function imageDataToGenerativePart(data, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(data).toString("base64"),
            mimeType
        },
    };
}

// Example usage







module.exports = router;
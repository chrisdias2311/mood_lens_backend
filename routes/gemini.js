const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");


const genAI = new GoogleGenerativeAI("AIzaSyB0TW1vcbeM8a56Uo8GT0TBriUZgDCfwdE");

async function textToEmotion(studentPID, message) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following message and identify the student's most likely emotion: ${message} (Choose from: Surprised, Confused, Happy, Bored).
    
    If any of these scenarios occur with student {Answer correct,
        Enjoy lesson,
        Understand concept,
        Work with peers,
        Feel supported,
        Control learning,
        Celebrate success,
        Connect with friends,
        Learn at own pace,
        Tech works well,
        Prefer online learning} the student is happy.
    
    If any of these scenarios happen {Unexpected announcement
        Guest speaker joins
        Technical glitch occurs
        Teacher makes a joke
        Learn something new
        See classmate online
        Win a game or contest
        Break from routine
        Teacher gives praise
        Unexpected question} the student is surprised.

    If any of these scenarios occur {Miss key instruction
        Technical issues arise
        Unclear explanation
        Fast lecture pace
        New vocabulary used
        Complex concept introduced
        Forget key information
        Hear unclear audio
        Lack practice opportunity
        Miss classmate explanation} the student is confused.
    
    If any of these scenarios occur {Repetitive material
        Unengaging activity
        Passive learning style
        Lack of interaction
        Technical difficulties
        Distracting environment
        Unclear learning goals
        Predictable routine
        Slow lecture pace
        Irrelevant content} the student is bored.
    
    Give the Answer in one word which is the most likely emotion.`

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emotion = response.text();
    return { studentPID, message, emotion };
}





//GPT generated code
// async function fetchAndProcessImage(imageUrl) {
//     const response = await axios.get(imageUrl, {
//         responseType: 'arraybuffer'
//     });

//     // Process image using sharp
//     const processedImageBuffer = await sharp(response.data)
//         .resize({ width: 800 }) // Resize image if needed
//         .toBuffer();

//     return processedImageBuffer;
// }

// async function run() {
//     // For text-and-image input (multimodal), use the gemini-pro-vision model
//     const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

//     const prompt = "What is this image about?";
//     const imageUrl = "https://media.istockphoto.com/id/520941891/photo/is-there-a-solution-to-this-algebra-problem.jpg?s=612x612&w=0&k=20&c=POQgdHKbTNiepO95H_SHbxBn98kCaqBJZ_HnvidZOp4=";

//     // Fetch and process image from URL
//     const processedImage = await fetchAndProcessImage(imageUrl);

//     const result = await model.generateContent([prompt, processedImage]);
//     const response = await result.response;
//     const text = response.text();
//     console.log(text);
// }




//Gemini generated code 
// async function getImageData(imageUrl) {
//     return new Promise((resolve, reject) => {
//         https.get(imageUrl, (response) => {
//             let data = "";
//             response.on("data", (chunk) => (data += chunk));
//             response.on("end", () => {
//                 if (response.statusCode === 200) {
//                     resolve({ data: Buffer.from(data).toString("base64"), mimeType: response.headers["content-type"] });
//                 } else {
//                     reject(new Error(`Failed to fetch image: ${response.statusCode}`));
//                 }
//             });
//         }).on("error", reject);
//     });
// }

// async function run() {
//     // For text-and-image input (multimodal), use the gemini-pro-vision model
//     const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

//     const imageUrl = "https://img.freepik.com/free-photo/profile-shot-energetic-dark-skinned-man-runs-highway-against-clear-sky-with-morning-light-wears-casual-comfortable-t-shirt-leggings-trainers-enjoys-spare-time-summer_273609-29398.jpg";

//     const prompt = "Imagine that you are a teacher and you have a few students in the class. You will receive an image of a student who is sitting in a virtual Classroom for your lecture. You have to identify the emotion of that student. The emotion should be amonge these four classes {Surprised, Confused, Happy, Bored}. Please give the response to me in a JSON format.";

//     try {
//         const imageData = await getImageData(imageUrl);

//         const imagePart = {
//             inlineData: imageData,
//         };

//         const result = await model.generateContent([prompt, imagePart]);
//         const response = await result.response;
//         const text = response.text();
//         console.log(text);
//     } catch (error) {
//         console.error("Err: " + error);

//     }
// }






//Copilot generated code
function imageDataToGenerativePart(data, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(data).toString("base64"),
            mimeType
        },
    };
}

const prompt = `Analyze the following image and identify the student's most likely emotion: 
    if any of the following scenarios are seen in the image {
        Smiling, 
        Bright Eyes, 
        Relaxed Facial Muscles, 
        Raised Cheeks, 
        Engagement, 
        Positive Body Language
    } the student is happy.

    If any of the following scenarios are seen in the image {
        Raised Eyebrows, 
        Open Mouth, 
        Wide Eyes, 
        Shocked Expression, 
        Surprise, 
        Heightened alertness.
    } the student is surprised.

    If any of the following scenarios are seen in the image {
        Furrowed Brows, 
        Squinting, 
        Frowning, 
        Confused Expression, 
        Discomfort, 
        Tension.
    } the student is confused.

    If any of the following scenarios are seen in the image {
        Blank or Distant Look,
        Heavy-Lidded Eyes,
        Yawning or Sighing, 
        Slumped Posture, 
        Closed Eyes, 
        Fidgeting, 
        Disengagement, 
        Negative Body Language.
    } the student is bored. 
    (Choose from: Surprised, Confused, Happy, Bored).
    Give the Answer in one word which is the most likely emotion.
`;


async function ImageToEmotion(studentPID, imageUrl) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const prompt = "Imagine that you are a teacher and you have a few students in the class. You will receive an image of a student who is sitting in a virtual Classroom for your lecture. You have to identify the emotion of that student. The emotion should be among these four classes {Surprised, Confused, Happy, Bored}. Please give the response In one word which is the emotion class";

    // Fetch the image data
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = imageResponse.data;
    const imagePart = imageDataToGenerativePart(imageData, "image/jpeg");

    const result = await model.generateContent([prompt, imagePart]);
    const modelResponse = await result.response;
    const emotion = modelResponse.text();

    return { studentPID, emotion };
}

// Function to run the generative model for an array of images
async function ImagesToEmotions(imgUrls) {
    const emotions = [];
    for (const imgData of imgUrls) {
        const { studentPID, imageUrl } = imgData;
        const emotionData = await ImageToEmotion(studentPID, imageUrl);
        emotions.push(emotionData);
    }
    return emotions;
}







// POST request to analyze emotion from the provided message
router.post('/text_to_emotion', async (req, res) => {
    try {
        const { studentPID, message } = req.body; // Extract studentPID and message from request body
        if (!studentPID || !message) throw new Error("Student PID and message are required.");

        const result = await textToEmotion(studentPID, message);
        res.json(result); // Send response as JSON
    } catch (error) {
        res.status(400).json({ error: error.message }); // Send error as JSON
    }
});

router.post('/images_to_emotions', async (req, res) => {
    try {
        const { imgUrls } = req.body; // Extract imgUrls from request body
        if (!Array.isArray(imgUrls)) throw new Error("imgUrls should be an array.");

        // Execute the runForImages function
        const emotions = await ImagesToEmotions(imgUrls);
        res.json({ emotions }); // Send response as JSON
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// router.post('/image_to_emotion', async (req, res) => {
//     try {
//         const { studentPID, imageUrl } = req.body; // Extract studentPID and imageUrl from request body
//         if (!studentPID || !imageUrl) throw new Error("Student PID and image URL are required.");

//         // Execute the run function
//         const result = await run(studentPID, imageUrl);
//         res.json(result); // Send response as JSON
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// POST request to analyze emotions from the provided images


module.exports = router;
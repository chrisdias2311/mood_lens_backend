const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();


const genAI = new GoogleGenerativeAI("AIzaSyB0TW1vcbeM8a56Uo8GT0TBriUZgDCfwdE");

async function textToEmotion(studentPID, message) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  
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

module.exports = router;
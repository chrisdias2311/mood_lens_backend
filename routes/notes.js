const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCTYERXkGoRT7Vh1jiyzfcVVyxT-2rL-2M");
router.post('/simplify_notes', async (req, res) => {
    try {
        const notes = req.body.notes;
        const simplifiedNotes = await generateSimplifiedNotes(notes);
        return res.json({ simplifiedNotes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

async function generateSimplifiedNotes(notes) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Reached here")
    const prompt = `Hey, can you please explain these notes to me like a 15 year old? ${notes}`;

    const result = await model.generateContent(prompt);

    console.log("Result", result);
    const response = await result.response;
    const simplifies_notes = response.text();
    console.log("Simplified Notes", simplifies_notes);
    return simplifies_notes;
}

module.exports = router;

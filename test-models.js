// Test script to check available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBif42GQGVAQGio24EaKeLi9MbBVTxeup8";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    console.log("Fetching available models...\n");
    
    // Try different model names that might work
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002", 
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-pro-vision",
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`✅ ${modelName} - WORKS!`);
        console.log(`   Response: ${response.text().substring(0, 50)}...\n`);
      } catch (error) {
        console.log(`❌ ${modelName} - Failed: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();

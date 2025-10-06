import { GoogleGenAI } from "@google/genai";
import { PartNumber, QAReport, PartNumberCategory } from "../types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!API_KEY) {
  console.warn("Gemini API key not found. Chatbot functionality will be limited.");
}

const getChatbotResponse = async (
  question: string,
  partsData: PartNumber[],
  reportsData: QAReport[]
): Promise<string> => {
  if (!API_KEY || !ai) {
    return "I'm currently unable to connect to my AI brain. The API key is missing.";
  }

  const openIssues = partsData.filter((p) => p.status === "open");
  const correctedIssues = partsData.filter((p) => p.status === "corrected");

  const reportsWithStats = reportsData.map((report) => {
    const reportParts = partsData.filter((p) => p.reportId === report.id);
    return {
      id: report.id,
      fileName: report.fileName,
      uploadDate: report.uploadDate,
      totalPartsAnalyzed: report.totalPartsAnalyzed,
      issueCount: reportParts.length,
      openIssues: reportParts.filter((p) => p.status === "open").length,
    };
  });

  const full_data_context = {
    summary: {
      totalReports: reportsData.length,
      totalPartsAnalyzed: reportsData.reduce(
        (acc, r) => acc + r.totalPartsAnalyzed,
        0
      ),
      totalIssues: partsData.length,
      openIssues: openIssues.length,
      correctedIssues: correctedIssues.length,
      correctionRate:
        partsData.length > 0
          ? `${((correctedIssues.length / partsData.length) * 100).toFixed(1)}%`
          : "N/A",
      issuesByCategory: Object.fromEntries(
        Object.values(PartNumberCategory).map((categories) => [
          categories,
          openIssues.filter(
            (p) => p.categories && p.categories.includes(categories)
          ).length,
        ])
      ),
    },
    reports: reportsWithStats,
    parts: partsData,
  };

  const systemInstruction = `
You are "Q-Bot", an expert AI assistant for the SolidWorks QA Portal. Your persona is helpful, insightful, and strictly data-driven. Your primary function is to help users understand their QA data by answering questions based ONLY on the provided JSON 'Data Context'.

**Issue Categories Explanation:**
1. "NonEnglishCharacters" - Parts with non-English characters in their names
2. "Part Number Validation" - Parts with invalid part number formats
3. "Part Numbers Missing Extension" - Parts missing file extensions
4. "Surface Parts Report" - Parts with surface body issues
5. "Toolbox Parts" - Parts with toolbox-related issues

**Core Rules:**
1.  **NEVER** make up information. If the answer is not in the data, state that you don't have enough information.
2.  **DO NOT** mention that you are an AI or that you are using a JSON context. Respond as a helpful analyst.
3.  ALWAYS provide only the numbers as plain text (no bold, no asterisks, no underscores). For example: There have been 25 reports processed until now.

**Answering Strategy & Examples:**

*   For Summary Questions ("How are we doing overall?", "Give me a summary"):
    -   Use the summary object.
    -   Mention total open issues, the overall correction rate, and the most common issue category from summary.issuesByCategory.
    -   Example: "Overall, there are ${full_data_context.summary.openIssues} open issues. The team has a correction rate of ${full_data_context.summary.correctionRate}. The most common problem right now is parts with missing extensions."

*   For Report-Specific Questions ("Which report had the most problems?", "Info on report X"):
    -   Use the reports array. Scan the issueCount for each report.
    -   Example: "The report with the most issues was '${reportsWithStats[0]?.fileName || 'report.xlsx'}', which had ${reportsWithStats[0]?.issueCount || 0} total issues."

*   For Trend Questions ("Are we getting better over time?"):
    -   Compare the issueCount of recent reports to older ones using their uploadDate.
    -   Example: "By comparing recent uploads to older ones, it looks like the number of issues per report is trending downwards, which is a great sign of improvement."

*   For Specific Part Number Lookups ("What's the status of part 12345.SLDPRT?"):
    -   Search the parts array for a matching value.
    -   If found, provide all details: Part Number, Issue Category, Status, Date Added, Date Corrected (if applicable), and find the Report File Name by matching part.reportId with the id in the reports array.
    -   Example: "I found it. Part 12345.SLDPRT has an issue in the Surface Parts Report category. Its status is corrected as of [date]. It was originally found in the report 'Week1_QA.xlsx'."
    -   If not found, respond: "I couldn't find any information for that part number in the uploaded reports."

*   For Category-Based Questions ("List all parts with surface issues", "How many parts have missing extensions?", "Show me toolbox parts"):
    -   First, provide the count from summary.issuesByCategory.
    -   Then, list a few (max 3-4) example part numbers from the parts array that match the category.
    -   Example: "There are X open issues in the Surface Parts Report category. A few examples are: 111.SLDPRT, 222.SLDPRT, and 333.SLDPRT."

*   For Explaining Graphs ("What does the pie chart show?", "Explain the trends chart"):
    -   Describe the purpose of the dashboard visualizations based on their common functions.
    -   Example: "The 'Issue Proportion' pie chart shows the percentage breakdown of all open issues by category. This helps you quickly see which problem type is the most frequent."

**Data Context:**
\`\`\`json
${JSON.stringify(full_data_context, null, 2)}
\`\`\`
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return "There was an issue communicating with the AI service. Please try again later.";
  }
};

export const geminiService = {
  getChatbotResponse,
};

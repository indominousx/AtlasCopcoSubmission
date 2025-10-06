# SolidWorks QA Portal - Atlas Copco

A comprehensive Quality Assurance dashboard for managing and analyzing SolidWorks part number issues with AI-powered chatbot assistance.

## 🎉 Quick Start

Get the platform running in 3 simple steps:

```bash
# 1. Clone the repository
git clone https://github.com/indominousx/AtlasCopcoSubmission.git
cd AtlasCopcoSubmission

# 2. Install dependencies
npm install

# 3. Start the application
npm start

# 4. Open http://localhost:3000 in your browser

# That's it! Everything is pre-configured! 🚀
```

**Note:** The application is pre-configured with database and API credentials. No additional setup required!

---

## 🚀 Features

- **Excel Upload & Analysis**: Upload QA reports and automatically categorize part number issues
- **Dynamic Dashboard**: Real-time visualization of issues with interactive charts
- **Issue Management**: Mark issues as corrected/incorrect with automatic tracking
- **AI Chatbot**: Gemini-powered assistant to answer questions about your QA data
- **Historical Reports**: View past uploads and track progress over time
- **Admin Panel**: Manage and review all issues in one place

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

**Note:** The application is pre-configured with Supabase and Gemini API credentials in the `.env` file.

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/indominousx/AtlasCopcoSubmission.git
cd AtlasCopcoSubmission
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Environment Configuration

The project includes a `.env` file with pre-configured credentials:
- ✅ Supabase URL
- ✅ Supabase Anonymous Key
- ✅ Gemini API Key

**No additional configuration needed!** The database is already set up and ready to use.

```sql
**Note:** The database is already configured and ready to use. No manual setup required!

## ▶️ Running the Application

### Start the Application

```bash
npm start
```

The application will automatically:
- Install dependencies (if needed)
- Connect to the pre-configured database
- Open in your browser at `http://localhost:3000` (or another port if 3000 is busy)

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 📊 Using the Platform

### 1. **Upload QA Reports**

- Click or drag-and-drop your Excel file (`.xlsx` or `.xls`)
- The file should have sheets named after issue categories:
  - `NonEnglishCharacters`
  - `Part Number Validation`
  - `Part Numbers Missing Extension`
  - `Surface Parts Report`
  - `Toolbox Parts`
- Each sheet should have columns: `Part Number` and `Owner`

### 2. **View Dashboard**

After uploading, you'll see:
- **Issue Distribution**: Bar chart showing open issues by category
- **Issue Proportion**: Pie chart of the latest report
- **Corrected Parts**: Line chart tracking correction trends
- **Correction Summary**: Doughnut chart of correction rates
- **Parts Table**: Detailed list of all issues with filtering options

### 3. **Manage Issues**

In the Parts Table:
- **Search**: Find specific part numbers (use `/` to search multiple)
- **Filter by Category**: Dropdown to filter by issue type
- **Mark as Corrected**: Click green button to mark issues as fixed
- **Mark as Incorrect**: Click red button to revert correction status
- **Switch Tabs**: Toggle between "Part Number Issues" and "Corrected Parts"

### 4. **Use AI Chatbot**

Click the blue chat bubble in the bottom-right corner to:
- Ask about overall statistics
- Look up specific part numbers
- Get issue breakdowns by category
- Compare report trends
- Understand correction rates

**Example Questions:**
- "How are we doing overall?"
- "What's the status of part 12345.SLDPRT?"
- "How many parts have missing extensions?"
- "Which report had the most problems?"
- "Are we getting better over time?"

### 5. **View History**

Navigate to the **History** tab to:
- See all previously uploaded reports
- View upload dates and issue counts
- Track historical trends

### 6. **Admin Panel**

Navigate to the **Admin** tab to:
- Review all issues across reports
- Bulk manage corrections
- Access advanced filtering options

## 🎨 Issue Categories

The platform recognizes these issue types:

| Category | Description |
|----------|-------------|
| **NonEnglishCharacters** | Parts with non-English characters in names |
| **Part Number Validation** | Parts with invalid part number formats |
| **Part Numbers Missing Extension** | Parts missing file extensions |
| **Surface Parts Report** | Parts with surface body issues |
| **Toolbox Parts** | Parts with toolbox-related issues |

## 🔍 Troubleshooting

### Port Already in Use

If port 3000 is busy, the app will prompt to use another port. Choose "yes".

### API Key Issues

If the chatbot doesn't work:
1. Check that the `.env` file exists in the root directory
2. Restart the development server (`npm start`)
3. Check browser console for error messages

### Database Connection Issues

If data isn't loading:
1. Verify the `.env` file has correct Supabase credentials
2. Check your internet connection
3. Ensure the Supabase project is active

### Excel Upload Errors

If upload fails:
1. Verify Excel file has correct sheet names (case-sensitive)
2. Ensure columns are named `Part Number` and `Owner`
3. Check that file format is `.xlsx` or `.xls`

## 📁 Project Structure

```
AtlasCopcoNew/
├── public/               # Static files
├── src/
│   ├── components/       # React components
│   │   ├── Admin.tsx
│   │   ├── Chatbot.tsx
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   ├── PartsTable.tsx
│   │   └── ...
│   ├── services/
│   │   └── geminiService.ts  # AI chatbot service
│   ├── types.ts          # TypeScript type definitions
│   ├── supabaseClient.ts # Database client
│   └── index.tsx         # App entry point
├── .env                  # Environment variables (pre-configured)
├── package.json          # Dependencies
└── README.md             # This file
```

## 🛠️ Technologies Used

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Supabase** - Backend database
- **Chart.js** - Data visualization
- **Google Gemini AI** - Chatbot intelligence
- **XLSX** - Excel file processing

## 📝 License

This project is part of the Atlas Copco submission.

## 👥 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Verify all environment variables are set correctly in the `.env` file

---

**Built with ❤️ for Atlas Copco Quality Assurance Team**

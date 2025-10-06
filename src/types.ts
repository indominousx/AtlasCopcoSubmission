// Enum for Part Number Categories - matching database issue_type values
export enum PartNumberCategory {
  NON_ENGLISH_CHARACTERS = "NonEnglishCharacters",
  PART_NUMBER_VALIDATION = "Part Number Validation",
  PART_NUMBERS_MISSING_EXTENSION = "Part Numbers Missing Extension",
  SURFACE_PARTS_REPORT = "Surface Parts Report",
  TOOLBOX_PARTS = "Toolbox Parts",
}

// Part Number issue representation
export interface PartNumber {
  id: string;
  value: string;
  categories?: PartNumberCategory[];
  status: "open" | "corrected";
  dateAdded: string;
  dateCorrected?: string;
  reportId: string;
  owner?: string;
}

// QA Report representation
export interface QAReport {
  id: string;
  fileName: string;
  uploadDate: string;
  totalPartsAnalyzed: number;
}

// Chat Message interface for chatbot
export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

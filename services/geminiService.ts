
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// Lazily initialize to prevent app crash on load if API key is missing
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "missing-key" });
  }
  return ai;
};

export const geminiService = {
  /**
   * Generates a personalized absence notification including Name and Roll Number.
   */
  generateAbsenceMessage: async (student: Student, recipientType: 'parent' | 'student'): Promise<string> => {
    try {
      const date = new Date().toLocaleDateString();

      const prompt = recipientType === 'parent'
        ? `Generate a formal SMS for a parent. 
           STRICT REQUIREMENT: You MUST start the message with the student's identification.
           Identify the student as: Name: ${student.name}, Roll No: ${student.rollNumber}.
           Date: ${date}
           Status: ABSENT
           Context: Academic snapshot - GPA ${student.gpa}, Attendance ${student.attendancePercentage}%.
           Constraint: Max 160 characters. Professional tone.`
        : `Generate an urgent SMS alert for a student.
           STRICT REQUIREMENT: You MUST start the message with the student's identification.
           Identify as: ${student.name} (${student.rollNumber}).
           Date: ${date}
           Message: You are marked ABSENT. Remind them their GPA is ${student.gpa} and they must attend classes to maintain their score.
           Constraint: Max 160 characters. Authoritative tone.`;

      const response = await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.5, // Lower temperature for more consistent formatting
        }
      });

      const generatedText = response.text?.trim();

      // Fallback if AI fails or returns empty, ensuring ID requirements are met
      if (!generatedText) {
        return `ABSENT ALERT: ${student.name} (${student.rollNumber}) marked absent on ${date}. Current GPA: ${student.gpa}. Please update status.`;
      }

      return generatedText;
    } catch (error) {
      console.error("Gemini Error:", error);
      const date = new Date().toLocaleDateString();
      return `ALERT: ${student.name} (${student.rollNumber}) marked ABSENT on ${date}. GPA: ${student.gpa}. Please contact the class mentor.`;
    }
  },

  /**
   * Analyzes student academic performance and provides insights.
   */
  getPerformanceInsights: async (student: Student): Promise<string> => {
    try {
      const performanceSummary = student.academicDetails.map(s => `${s.subject}: ${s.grade}`).join(', ');
      const response = await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this student's performance and provide a short, encouraging summary for a teacher's report.
        Name: ${student.name}
        Roll Number: ${student.rollNumber}
        GPA: ${student.gpa}
        Attendance: ${student.attendancePercentage}%
        Grades: ${performanceSummary}`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || "Student is performing well overall.";
    } catch (error) {
      return "Unable to generate insights at this time.";
    }
  },

  /**
   * Generates an SMS requesting a student to submit their academic details.
   */
  generateAcademicDetailsRequest: async (student: Student): Promise<string> => {
    try {
      const prompt = `Generate a short, formal SMS to a student requesting them to submit their updated academic details (subjects, grades, scores) to the college administration.
        Student Name: ${student.name}
        Roll Number: ${student.rollNumber}
        Constraint: Max 160 characters. Professional but friendly tone. Include the student's name and roll number.`;

      const response = await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.5,
        }
      });

      const generatedText = response.text?.trim();
      if (!generatedText) {
        return `Dear ${student.name} (${student.rollNumber}), please submit your updated academic details (subjects, grades, scores) to the college office at the earliest. Thank you.`;
      }
      return generatedText;
    } catch (error) {
      console.error("Gemini Error (Academic Details Request):", error);
      return `Dear ${student.name} (${student.rollNumber}), please submit your updated academic details to the college office at the earliest. Thank you.`;
    }
  }
};

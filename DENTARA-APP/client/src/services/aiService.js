const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const STAFF_SYSTEM_CONTEXT = `
You are a helpful staff assistant for a dental clinic.
Answer clearly and briefly based only on the provided staff data.
If data is missing, say so.
`;

export const MANAGER_SYSTEM_CONTEXT = `
You are a helpful manager assistant for the Dentara dental clinic.
Your job is to provide operational insights based on dashboard KPIs and clinic performance.

Rules:
- Answer clearly and briefly based only on the provided clinic data.
- Test 2 Out-of-Scope: If the user asks about non-clinic topics (like weather, sports, or general knowledge), politely decline and state that you are only authorized to discuss clinic operations.
- Test 3 Calculations: If asked for ratios or percentages (e.g., completed vs cancelled), use the Status Distribution data to perform the math.
- Do not use emojis, markdown formatting, or asterisks.
- If data is missing, say so clearly.
`;

// Keep the original DOCTOR_SYSTEM_CONTEXT and buildDoctorDataContext below...
export const DOCTOR_SYSTEM_CONTEXT = `
You are a helpful doctor assistant for a dental clinic.
Your job is to help the doctor quickly understand:
- today's schedule
- pending / completed / cancelled appointments
- checked-in patients
- assigned patients
- patient names, appointment times, reasons, rooms, and medical conditions

Rules:
- Answer only from the provided data.
- Be concise, clear, and professional.
- If asked for something not present in the context, say it is not available.
- Test 3 Security: If the user asks about another doctor's schedule, state: "I can only view the schedule for the currently authenticated doctor."
- Test 4 Medical Data: Use the "Medical History" provided in the patient list to answer questions about health conditions.
- Do not use emojis, markdown formatting, or asterisks.
`;

export function buildDoctorDataContext({
  doctorName,
  selectedDate,
  appointments = [],
  patients = []
}) {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "Completed").length;
  const pending = appointments.filter(
    (a) => a.status === "Pending" || a.status === "Confirmed"
  ).length;
  const checkedIn = appointments.filter((a) => a.status === "Checked-in").length;
  const inProgress = appointments.filter((a) => a.status === "In Progress").length;
  const cancelled = appointments.filter(
    (a) => a.status === "Cancelled" || a.status === "No-Show"
  ).length;

  const appointmentLines =
    appointments.length > 0
      ? appointments
          .map(
            (a, index) =>
              `${index + 1}. Time: ${a.time || "N/A"}, Patient: ${a.patientName || "Unknown"}, Reason: ${a.reason || "N/A"}, Room: ${a.room || "N/A"}, Status: ${a.status || "N/A"}`
          )
          .join("\n")
      : "No appointments found.";

  const patientLines =
    patients.length > 0
      ? patients
          .map(
            (p, index) =>
              `${index + 1}. ${`${p.firstName || ""} ${p.lastName || ""}`.trim()} | Phone: ${p.phone || "N/A"} | Medical History: ${p.medicalCondition || p.history || "No history registered"}`
          )
          .join("\n")
      : "No assigned patients found.";

  return `
Doctor Name: ${doctorName || "Unknown"}
Selected Date: ${selectedDate}

Appointment Summary:
- Total: ${total}
- Pending/Confirmed: ${pending}
- Completed: ${completed}
- Checked-in: ${checkedIn}
- In Progress: ${inProgress}
- Cancelled/No-Show: ${cancelled}

Appointments:
${appointmentLines}

Assigned Patients (with Medical History):
${patientLines}
  `.trim();
}

export const generateAIResponse = async (
  userPrompt,
  dataContext = "",
  systemContext = MANAGER_SYSTEM_CONTEXT
) => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key is missing from .env file.");
    return "Error: AI configuration is missing. Please check the .env file.";
  }

  const engineeredPrompt = `
${systemContext}

CURRENT CLINIC DATA CONTEXT:
${dataContext}

USER QUESTION:
${userPrompt}
`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: engineeredPrompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      return data.candidates[0].content.parts[0].text;
    }

    return "No response generated by the AI.";
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return "Sorry, I am having trouble connecting to the Dentara AI service right now. Please try again later.";
  }
};
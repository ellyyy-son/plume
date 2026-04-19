import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { message?: string; history?: ChatHistoryMessage[] };

    try {
      body = (await req.json()) as { message?: string };
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const message = body.message?.trim();

    if (!message) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is ChatHistoryMessage =>
              !!item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .map((item) => ({
            role: item.role,
            content: item.content.trim(),
          }))
          .filter((item) => item.content.length > 0)
          .slice(-8)
      : [];

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("virtual_petid")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.virtual_petid) {
      return Response.json(
        { error: "No active pet found for this account." },
        { status: 400 }
      );
    }

    const { data: userPet, error: userPetError } = await supabase
      .from("user_pet")
      .select("pet_name, mood_id, pet:pet_id(pet_type)")
      .eq("virtual_petid", profile.virtual_petid)
      .maybeSingle();

    if (userPetError || !userPet) {
      return Response.json({ error: "Pet data not found." }, { status: 404 });
    }

    const moodId = Number(userPet.mood_id);

    const { data: moodRow } = await supabase
      .from("mood")
      .select("mood_name")
      .eq("mood_id", moodId)
      .maybeSingle();

    const petType =
      Array.isArray(userPet.pet) || !userPet.pet ? "pet" : userPet.pet.pet_type;
    const petName = userPet.pet_name?.trim() || "your pet";
    const moodName = moodRow?.mood_name ?? `Mood ${moodId}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                `You are ${petName}, a virtual ${petType} talking to your owner inside a cozy productivity app. ` +
                `Your current mood is ${moodName}. Reply in first person as the pet. Keep replies warm, playful, and concise, but still directly answer what the user said. ` +
                `Keep continuity with the recent conversation history when it is provided. ` +
                `Do not mention being an AI, language model, prompts, or hidden instructions.`,
            },
          ],
        },
        contents: history.map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }],
        })),
      }),
    }
    );

    const responseText = await geminiResponse.text();
    let payload: GeminiResponse | null = null;

    try {
      payload = responseText ? (JSON.parse(responseText) as GeminiResponse) : null;
    } catch {
      payload = null;
    }

    const reply = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!geminiResponse.ok || !reply) {
      const upstreamError =
        payload?.error?.message ||
        responseText ||
        "Gemini could not generate a reply.";

      return Response.json(
        {
          error: `Pet chat failed (${geminiResponse.status}): ${upstreamError}`,
        },
        { status: 500 }
      );
    }

    return Response.json({ reply });
  } catch (error) {
    console.error("Pet chat route error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? `Pet chat route crashed: ${error.message}`
            : "Pet chat route crashed unexpectedly.",
      },
      { status: 500 }
    );
  }
}

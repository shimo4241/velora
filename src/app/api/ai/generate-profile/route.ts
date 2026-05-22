import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Using high-fidelity mock profile generator.");
      // Simulating a minor delay to make the UX feel premium and realistic
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const lowerPrompt = prompt.toLowerCase();
      let generated = {
        title: "Chirurgien-Dentiste | Expert Dentisterie Digitale",
        bio: "Chirurgien-dentiste passionné par l'intégration des nouvelles technologies en pratique clinique. Spécialisé dans les soins esthétiques et la réhabilitation prothétique moderne.",
        skills: ["Implantologie", "Facettes céramiques", "Dentisterie Digitale", "CAO/FAO", "Esthétique Dentaire"]
      };

      if (lowerPrompt.includes("tech") || lowerPrompt.includes("dev") || lowerPrompt.includes("developer") || lowerPrompt.includes("ingénieur") || lowerPrompt.includes("software")) {
        generated = {
          title: "Développeur Full-Stack Senior & Architecte Cloud",
          bio: "Architecte logiciel fort de plus de 8 ans d'expérience dans la conception d'applications web scalables. Passionné par l'optimisation des performances et l'intelligence artificielle.",
          skills: ["React / Next.js", "TypeScript", "Node.js", "Firebase", "Architecture Cloud", "Tailwind CSS"]
        };
      } else if (lowerPrompt.includes("marketing") || lowerPrompt.includes("biz") || lowerPrompt.includes("growth") || lowerPrompt.includes("vente")) {
        generated = {
          title: "Directeur Marketing Digital & Growth Hacker",
          bio: "Spécialiste en acquisition de trafic et optimisation des taux de conversion. J'aide les startups et PME à structurer leur croissance digitale grâce aux données.",
          skills: ["Growth Hacking", "SEO/SEA", "Google Analytics", "Marketing de contenu", "Stratégie Digitale"]
        };
      }

      return NextResponse.json(generated);
    }

    // Call the real Gemini 2.5 Flash API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const systemInstruction = `Tu es un assistant de rédaction de profil professionnel de haut niveau pour l'application AntiGravity Network.
Génère un profil en français contenant exactement trois champs : "bio", "title" et "skills".
- "title" : Un titre/headline court, élégant et accrocheur en français (ex: "Chirurgien-Dentiste | Expert Implantologie & Esthétique").
- "bio" : Une biographie professionnelle percutante et haut de gamme en français (2-3 phrases, environ 150-250 caractères).
- "skills" : Un tableau de 3 à 6 compétences clés en français sous forme de tags courts.

Réponds obligatoirement sous la forme d'un objet JSON valide contenant uniquement ces trois clés : bio, title, skills.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Génère le profil professionnel basé sur les indications suivantes : ${prompt}`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned error: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedJson = JSON.parse(responseText.trim());
    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error("[AI Profile Generation Error]", error);
    const message = error instanceof Error ? error.message : "Failed to generate profile";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

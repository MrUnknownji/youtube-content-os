export type ContentLanguage = "hinglish" | "hindi" | "english";

interface LanguageToggleProps {
  value: ContentLanguage;
  onChange: (lang: ContentLanguage) => void;
  size?: "sm" | "default";
}

const LANGUAGES: { value: ContentLanguage; label: string }[] = [
  { value: "hinglish", label: "Hinglish" },
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
];

export function LanguageToggle({
  value,
  onChange,
  size = "default",
}: LanguageToggleProps) {
  return (
    <div className="flex items-center rounded-xl bg-muted p-0.5 gap-0.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onChange(lang.value)}
          className={`
            rounded-lg font-medium transition-all duration-150 select-none
            ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"}
            ${
              value === lang.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

export function getLanguageInstruction(lang: ContentLanguage): string {
  switch (lang) {
    case "hinglish":
      return 'Write in HINGLISH — a natural mix of Hindi and English written in Roman/English script. Example style: "Aaj hum dekhenge kaise aap apni productivity badha sakte ho using simple techniques." Sound like a conversational Indian creator.';
    case "hindi":
      return 'Write entirely in HINDI using the Devanagari script (हिंदी). Use natural, everyday spoken Hindi — not overly formal or literary. Example: "आज हम देखेंगे कैसे आप अपनी productivity बढ़ा सकते हैं।"';
    case "english":
      return "Write in clear, fluent ENGLISH. Use a conversational and accessible tone suitable for a YouTube audience.";
  }
}

export const formatPrompt = (raw: TemplateStringsArray) =>
  raw
    .join()
    .split("\n")
    .map((i) => i.trim())
    .join("");

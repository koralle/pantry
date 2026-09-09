import { readFileSync } from "node:fs";

const DENY_MESSAGE_SUFFIX = "Only Grok 4.6 and Composer 2.5 are allowed.";
const GROK_4_6_PATTERN = /(?:^|[^a-z0-9])grok-4(?:\.|-)6(?:[^0-9]|$)/u;
const COMPOSER_2_5_PATTERN = /(?:^|[^a-z0-9])composer-2(?:\.|-)5(?:[^0-9]|$)/u;

const writeDecision = (permission, modelLabel = "unknown") => {
  if (permission === "allow") {
    process.stdout.write(JSON.stringify({ permission: "allow" }));
    return;
  }

  process.stdout.write(
    JSON.stringify({
      permission: "deny",
      user_message: `Blocked subagent model: ${modelLabel}. ${DENY_MESSAGE_SUFFIX}`,
    })
  );
};

const extractModelId = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return "";
};

const normalizeModelId = (value) => {
  const raw = extractModelId(value);
  if (raw === "") {
    return "";
  }

  return raw
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(/\s+/g, "-")
    .replace(/\[.*$/u, "")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/^-+|-+$/g, "");
};

const isAllowedFamily = (normalized) =>
  GROK_4_6_PATTERN.test(normalized) || COMPOSER_2_5_PATTERN.test(normalized);

const isAllowedSubagentEvent = (event) => {
  const subagentModel = normalizeModelId(event.subagent_model);

  if (subagentModel === "inherit") {
    const parentFromId = normalizeModelId(event.model_id);
    const parentModel =
      parentFromId === "" ? normalizeModelId(event.model) : parentFromId;
    return isAllowedFamily(parentModel);
  }

  return isAllowedFamily(subagentModel);
};

const labelFor = (event) => {
  const subagentModel = normalizeModelId(event.subagent_model);
  return subagentModel === "" ? "unknown" : subagentModel;
};

const parseEvent = (input) => {
  const parsed = JSON.parse(input);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("Hook input must be a JSON object");
  }

  return parsed;
};

const main = () => {
  try {
    const event = parseEvent(readFileSync(0, "utf-8"));
    if (isAllowedSubagentEvent(event)) {
      writeDecision("allow");
      return;
    }

    writeDecision("deny", labelFor(event));
  } catch {
    writeDecision("deny", "unknown");
  }
};

main();

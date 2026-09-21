import { formatUsd } from "./core/money.js";
import { buildContributionRecord, explainContributionRecord } from "./core/record.js";

const form = document.querySelector("#record-form");
const recurringEnabled = document.querySelector("#recurring-enabled");
const recurringFields = document.querySelector("#recurring-fields");
const recurringInputs = Array.from(recurringFields.querySelectorAll("input, select"));
const formError = document.querySelector("#form-error");
const resultCard = document.querySelector("#result-card");
const emptyState = document.querySelector("#empty-state");
const recordResult = document.querySelector("#record-result");
const copyButton = document.querySelector("#copy-json");
const copyStatus = document.querySelector("#copy-status");

let canonicalJson = "";

recurringEnabled.addEventListener("change", () => {
  const enabled = recurringEnabled.checked;
  recurringFields.hidden = !enabled;
  recurringInputs.forEach((input) => {
    input.required = enabled;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();

  if (!form.reportValidity()) {
    return;
  }

  const input = {
    initialAmount: document.querySelector("#initial-amount").value,
    initialDate: document.querySelector("#initial-date").value,
    recurring: recurringEnabled.checked
      ? {
          amount: document.querySelector("#recurring-amount").value,
          end: document.querySelector("#recurring-end").value,
          frequency: document.querySelector("#recurring-frequency").value,
          start: document.querySelector("#recurring-start").value
        }
      : null
  };

  try {
    const result = await buildContributionRecord(input);
    canonicalJson = result.canonicalJson;
    renderResult(result);
  } catch (error) {
    showError(error instanceof Error ? error.message : "The record could not be built.");
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(canonicalJson);
    copyStatus.textContent = "Copied.";
  } catch {
    copyStatus.textContent = "Copy failed. Your browser may block clipboard access.";
  }
});

function renderResult({ record, fingerprint }) {
  document.querySelector("#event-count").textContent = String(record.summary.eventCount);
  document.querySelector("#total-recorded").textContent = formatUsd(record.summary.totalMinor);
  document.querySelector("#record-explanation").textContent = explainContributionRecord(record);
  document.querySelector("#record-fingerprint").textContent = fingerprint;
  copyStatus.textContent = "";

  const rows = document.querySelector("#record-rows");
  rows.replaceChildren(
    ...record.events.map((item) => {
      const row = document.createElement("tr");
      row.append(
        createCell(item.date),
        createCell(item.type === "initial" ? "Initial" : "Recurring"),
        createCell(formatUsd(item.amountMinor), "numeric")
      );
      return row;
    })
  );

  emptyState.hidden = true;
  recordResult.hidden = false;
  resultCard.classList.remove("empty-result");
}

function createCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function hideError() {
  formError.textContent = "";
  formError.hidden = true;
}

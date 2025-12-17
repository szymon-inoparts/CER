// Konfiguracja i stałe globalne
const SELLASIST_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-z-sellasist";
const SEND_TO_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/przeslij-do-CER";
const GET_LAST_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-ostatnie-z-CER";
const GET_ONE_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/pobierz-jedno-z-CER";
const SHOW_FROM_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/wy%C5%9Bwietl";
const GENERATE_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/generuj-odpowiedz";
const PROCESSORS_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/procesorzy-reklamacji";
const UPDATE_CER_WEBHOOK = "https://kamil-inoparts.app.n8n.cloud/webhook/aktualizacja-CER";

const PASSWORD_VALUE = "inoparts";
const DEFAULT_NO_RESPONSE_TEXT =
  "Brak możliwości weryfikacji: Pomimo naszych prób kontaktu nie otrzymaliśmy odpowiedzi, dlatego zamykamy zgłoszenie.";

const COMPANY_VALUE = "INOPARTS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ\nUl. Adama Staszczyka 1/20, 30-123 Kraków\nNIP: 6772477900";

// Minimalne tłumaczenia dla mapowania decyzji
const DOCX_TRANSLATIONS = {
  PL: { decisionValues: { pozytywna: "Pozytywna", negatywna: "Negatywna" } },
  CZ: { decisionValues: { pozytywna: "Uznáno", negatywna: "Zamítnuto" } },
  DE: { decisionValues: { pozytywna: "Positiv", negatywna: "Abgelehnt" } },
  SK: { decisionValues: { pozytywna: "Uznané", negatywna: "Zamietnuté" } },
  HU: { decisionValues: { pozytywna: "Elfogadva", negatywna: "Elutasítva" } },
  EN: { decisionValues: { pozytywna: "Accepted", negatywna: "Rejected" } }
};

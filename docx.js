// Generowanie dokumentów DOCX dla poszczególnych języków

function appendCompanySection(docChildren, t, Paragraph, TextRun) {
  docChildren.push(new Paragraph({ children: [new TextRun({ text: t.companyLabel, bold: true })], spacing: { after: 80 } }));
  t.companyValue
    .split("\n")
    .forEach((line) => docChildren.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 40 } })));
}

function appendClientSection(docChildren, t, claim, Paragraph, TextRun) {
  docChildren.push(new Paragraph({ children: [new TextRun({ text: t.customerLabel, bold: true })], spacing: { before: 120, after: 80 } }));
  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      docChildren.push(new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 120 : 40 } }))
    );
  } else {
    docChildren.push(new Paragraph({ children: [new TextRun({ text: "-" })], spacing: { after: 120 } }));
  }
}

function appendTitleSection(docChildren, t, Paragraph, TextRun, AlignmentType) {
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: t.title, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
}

function buildDocxGerman(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decisionText = (decisionValue || "").toLowerCase().includes("neg") ? "Abgelehnt" : decisionValue || "Abgelehnt";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "NIP: 6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Antwort auf Ihre Reklamation", bold: true, underline: {} })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Produkte:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Name", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Menge", value: firstProduct.quantity },
      { label: "Produktwert", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Kaufdatum", purchaseDate);
  addLabelValue("Reklamationsdatum", complaintDate);
  addLabelValue("Beschwerdegrund", claim.reason || "-");
  addLabelValue("Entscheidung", decisionText || "-");
  addLabelValue("Begründung", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Ihre Reklamation wurde unter Berücksichtigung aller gesetzlichen Rechte geprüft. Wir weisen Sie darauf hin, dass Sie das Recht haben, gegen diese Entscheidung Widerspruch einzulegen. Für weitere Rückfragen stehen wir Ihnen gerne zur Verfügung.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Mit freundlichen Grüßen" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocxCzech(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText =
    decLower.includes("zam") ? "Zamítnuto" : decLower.includes("uzn") || decLower.includes("poz") ? "Uznáno" : decisionValue || "Zamítnuto";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "NIP: 6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vyjádření k reklamaci", bold: true })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Podrobnosti o produktu:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Název", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Množství", value: firstProduct.quantity },
      { label: "Hodnota produktu", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Datum nákupu", purchaseDate);
  addLabelValue("Datum přijetí reklamace", complaintDate);
  addLabelValue("Důvod reklamace", claim.reason || "-");
  addLabelValue("Rozhodnutí o reklamaci", decisionText || "-");
  addLabelValue("Odůvodnění", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Vaše reklamace byla posouzena v souladu se všemi zákonnými právy spotřebitele. Upozorňujeme, že máte právo podat proti tomuto rozhodnutí odvolání. V případě dalších dotazů jsme Vám plně k dispozici.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "S pozdravem," })], spacing: { after: 80 } });
  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Tým INOPARTS" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocxSlovak(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText =
    decLower.includes("zam") ? "Zamietnuté" : decLower.includes("uzn") || decLower.includes("poz") ? "Uznané" : decisionValue || "Zamietnuté";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "IČ DPH: PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vyjadrenie k reklamácii", bold: true })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Podrobnosti o produkte:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Názov", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Množstvo", value: firstProduct.quantity },
      { label: "Hodnota produktu", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Dátum nákupu", purchaseDate);
  addLabelValue("Dátum prijatia reklamácie", complaintDate);
  addLabelValue("Dôvod reklamácie", claim.reason || "-");
  addLabelValue("Rozhodnutie o reklamácii", decisionText || "-");
  addLabelValue("Odôvodnenie", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Vaša reklamácia bola posúdená v súlade so všetkými zákonnými právami spotrebiteľa. Upozorňujeme Vás, że máte právo podať proti tomuto rozhodnutiu odvolanie. V prípade ďalších otázok sme Vám plne k dispozícii.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "S pozdravom," })], spacing: { after: 80 } });
  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Tím INOPARTS" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocxHungarian(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText =
    decLower.includes("elutas") || decLower.includes("neg")
      ? "Elutasítva"
      : decLower.includes("elfog") || decLower.includes("poz")
      ? "Elfogadva"
      : decisionValue || "Elutasítva";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Krakkó`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "Adószám (EU): PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tájékoztatás reklamáció elbírálásáról", bold: true })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Termékadatok:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Terméknév", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Mennyiség", value: firstProduct.quantity },
      { label: "Termék értéke", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Vásárlás időpontja", purchaseDate);
  addLabelValue("Reklamáció bejelentésének időpontja", complaintDate);
  addLabelValue("Panasz oka", claim.reason || "-");
  addLabelValue("Reklamációval kapcsolatos döntés", decisionText || "-");
  addLabelValue("Indokolás", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Panaszát az összes törvényes fogyasztói jog figyelembevételével vizsgáltuk felül. Tájékoztatjuk, hogy Önnek jogában áll ezen döntés ellen fellebbezéssel élni. További kérdések esetén készséggel állunk rendelkezésére.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Üdvözlettel:" })], spacing: { after: 80 } });
  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Az INOPARTS csapata" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocxEnglish(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText =
    decLower.includes("reject") || decLower.includes("decline") || decLower.includes("neg")
      ? "Rejected"
      : decLower.includes("accept") || decLower.includes("approve") || decLower.includes("poz")
      ? "Accepted"
      : decisionValue || "Rejected";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków, Poland" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "VAT ID: PL6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Response to Complaint", bold: true })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Product Details:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Product Name", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Quantity", value: firstProduct.quantity },
      { label: "Product Value", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Purchase Date", purchaseDate);
  addLabelValue("Date of Complaint", complaintDate);
  addLabelValue("Reason for Complaint", claim.reason || "-");
  addLabelValue("Decision", decisionText || "-");
  addLabelValue("Justification", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Your complaint has been reviewed in accordance with all applicable consumer rights and statutory regulations. Please be advised that you have the right to appeal this decision. Should you have any further questions, please do not hesitate to contact us.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Yours sincerely," })], spacing: { after: 80 } });
  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "INOPARTS Team" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocxPolish(claim, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
  const todayDot = formatDateDot(new Date());
  const purchaseDate = formatDateDot(claim.purchaseDate || claim.orderDate);
  const complaintDate = formatDateDot(claim.receivedAt || claim.decisionDue || new Date());
  const decLower = String(decisionValue || "").toLowerCase();
  const decisionText =
    decLower.includes("odrz") || decLower.includes("neg")
      ? "Odrzucona"
      : decLower.includes("uzn") || decLower.includes("poz")
      ? "Uznana"
      : decisionValue || "";
  const products = Array.isArray(claim.products) ? claim.products : [];
  const firstProduct = products[0] || {};
  const priceText = `${firstProduct.price ?? ""} ${firstProduct.currency || claim.currency || ""}`.trim();

  const docChildren = [];
  const addParagraph = (opts) => docChildren.push(new Paragraph(opts));

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${todayDot}, Kraków`, bold: true })], spacing: { after: 240 } });
  addParagraph({ children: [new TextRun({ text: "INOPARTS SP. Z O.O.", bold: true })], spacing: { after: 40 } });
  addParagraph({ children: [new TextRun({ text: "Ul. Adama Staszczyka 1/20, 30-123 Kraków" })], spacing: { after: 20 } });
  addParagraph({ children: [new TextRun({ text: "NIP: 6772477900" })], spacing: { after: 200 } });

  const clientLines = formatClientLines(claim);
  if (clientLines.length) {
    clientLines.forEach((line, idx) =>
      addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: line })], spacing: { after: idx === clientLines.length - 1 ? 200 : 40 } })
    );
  }

  addParagraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Decyzja reklamacyjna", bold: true })], spacing: { after: 200 } });
  addParagraph({ children: [new TextRun({ text: "Szczegóły produktu:", bold: true })], spacing: { after: 80 } });

  if (products.length) {
    const bullets = [
      { label: "Nazwa produktu", value: firstProduct.name },
      { label: "SKU", value: firstProduct.sku },
      { label: "Ilość", value: firstProduct.quantity },
      { label: "Wartość produktu", value: priceText }
    ];
    bullets.forEach((item) => {
      addParagraph({
        children: [
          new TextRun({ text: "•  " }),
          new TextRun({ text: `${item.label}: `, bold: true }),
          new TextRun({ text: item.value !== undefined && item.value !== null && item.value !== "" ? String(item.value) : "-" })
        ],
        spacing: { after: 40 }
      });
    });
  } else {
    addParagraph({ children: [new TextRun({ text: "•  -" })], spacing: { after: 80 } });
  }

  const addLabelValue = (label, value) => {
    addParagraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value || "-" })], spacing: { after: 120 } });
  };

  addLabelValue("Data zakupu", purchaseDate);
  addLabelValue("Data zgłoszenia reklamacji", complaintDate);
  addLabelValue("Powód reklamacji", claim.reason || "-");
  addLabelValue("Decyzja", decisionText || "-");
  addLabelValue("Uzasadnienie", answerText || "-");

  addParagraph({
    children: [
      new TextRun({
        text:
          "Państwa reklamacja została rozpatrzona zgodnie z obowiązującymi przepisami prawa oraz z uwzględnieniem praw konsumenta. Informujemy, że od powyższej decyzji przysługuje Państwu prawo do odwołania. W przypadku dodatkowych pytań pozostajemy do Państwa dyspozycji.",
        bold: false
      })
    ],
    spacing: { before: 160, after: 200 }
  });

  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Z poważaniem," })], spacing: { after: 80 } });
  addParagraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Zespół INOPARTS" })], spacing: { after: 120 } });

  return Packer.toBlob(new Document({ sections: [{ children: docChildren }] }));
}

function buildDocx(claim, lang, answerText, decisionValue) {
  if (!window.docx) throw new Error("Brak biblioteki docx");
  const upperLang = (lang || "").toUpperCase();
  if (upperLang === "DE") return buildDocxGerman(claim, answerText, decisionValue);
  if (upperLang === "CZ") return buildDocxCzech(claim, answerText, decisionValue);
  if (upperLang === "SK") return buildDocxSlovak(claim, answerText, decisionValue);
  if (upperLang === "HU") return buildDocxHungarian(claim, answerText, decisionValue);
  if (upperLang === "EN") return buildDocxEnglish(claim, answerText, decisionValue);
  return buildDocxPolish(claim, answerText, decisionValue);
}

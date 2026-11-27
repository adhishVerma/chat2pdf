// Builds a small text-only PDF in memory, so tests don't need a sample file
// checked into the repo. Each page is a list of lines.
export function makePdf(pages: string[][]): Buffer {
    const esc = (s: string) => s.replace(/[\\()]/g, (c) => "\\" + c);
    const objects: string[] = [];
    const add = (body: string) => objects.push(body); // object number = index + 1

    add("<< /Type /Catalog /Pages 2 0 R >>");
    add(""); // pages tree, filled in below
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const pageIds: number[] = [];
    for (const lines of pages) {
        const stream = `BT /F1 11 Tf 14 TL 50 780 Td ${lines.map((l) => `(${esc(l)}) Tj T*`).join(" ")} ET`;
        add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
        add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${objects.length} 0 R >>`);
        pageIds.push(objects.length);
    }
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let out = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((body, i) => {
        offsets.push(Buffer.byteLength(out));
        out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = Buffer.byteLength(out);
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(out, "latin1");
}

const filler = (topic: string, n: number) =>
    Array.from({ length: n }, (_, i) => `Clause ${i + 1}. General provisions about ${topic} apply as written in this chapter.`);

// A three-page "legal code" used by the unit and e2e tests. "Criminal
// conspiracy" is defined on page 2, so citations can be checked.
export function samplePdf(): Buffer {
    return makePdf([
        ["CHAPTER I. INTRODUCTION", ...filler("territorial extent", 40)],
        [
            "CHAPTER V-A. CRIMINAL CONSPIRACY",
            "120A. Definition of criminal conspiracy. When two or more persons agree to do, or cause",
            "to be done, an illegal act, or an act which is not illegal by illegal means, such an",
            "agreement is designated a criminal conspiracy.",
            "120B. Punishment of criminal conspiracy. Whoever is a party to a criminal conspiracy",
            "to commit an offence punishable with death or imprisonment shall be punished.",
            ...filler("abetment", 30),
        ],
        ["CHAPTER XVI. OFFENCES AFFECTING THE HUMAN BODY", "302. Punishment for murder.", ...filler("the human body", 40)],
    ]);
}

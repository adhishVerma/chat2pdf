declare module "pdf-parse/lib/pdf-parse.js" {
    type Options = { pagerender?: (pageData: any) => Promise<string>; max?: number };
    export default function pdfParse(data: Buffer, options?: Options): Promise<{ numpages: number; text: string }>;
}

declare module 'pdf-parse' {
  export class PDFParse {
    constructor(options: { data: Buffer | Uint8Array });
    getText(options?: any): Promise<{
      total: number;
      text: string;
      pages: Array<{ num: number; text: string }>;
    }>;
  }
  const defaultExport: any;
  export default defaultExport;
}

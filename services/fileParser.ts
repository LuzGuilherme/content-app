import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF worker
// Note: In a Vite environment, we might need to point to the worker file in public or node_modules
// For simplicity in this environment, let's try setting it up directly if possible, or assume it loads.
// If it fails, we might need to copy the worker to public folder.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
        throw new Error("Could not determine file type.");
    }

    try {
        if (extension === 'pdf') {
            return await parsePdf(file);
        } else if (extension === 'docx') {
            return await parseDocx(file);
        } else if (['txt', 'md', 'json', 'csv', 'js', 'ts', 'tsx', 'py', 'html', 'css'].includes(extension)) {
            return await parseText(file);
        } else {
            throw new Error(`Unsupported file type: .${extension}`);
        }
    } catch (error: any) {
        console.error("File parsing error:", error);
        throw new Error(`Failed to read file: ${error.message}`);
    }
};

const parseText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error("Empty file"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
};

const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

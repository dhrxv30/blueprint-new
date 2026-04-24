import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runPythonPdfParser(pdfBuffer: Buffer): Promise<any> {
    const tempPdfPath = path.join(os.tmpdir(), `prd_${Date.now()}.pdf`);
    
    try {
        // 1. Write the buffer to a temporary file
        await fs.writeFile(tempPdfPath, pdfBuffer);

        // 2. Resolve the path to the python script inside the backend architecture
        const scriptPath = path.resolve(__dirname, "python/pdf_parser.py");

        // 3. Spawn the python process
        return await new Promise((resolve, reject) => {
            const pythonProcess = spawn("python", [scriptPath, tempPdfPath]);
            
            let stdoutData = "";
            let stderrData = "";

            pythonProcess.stdout.on("data", (data) => {
                stdoutData += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                stderrData += data.toString();
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error("Python Error:", stderrData);
                    reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
                    return;
                }
                
                try {
                    const parsedJson = JSON.parse(stdoutData);
                    resolve(parsedJson);
                } catch (parseError) {
                    console.error("Failed to parse Python stdout:", stdoutData);
                    reject(new Error("Failed to parse the Python JSON output"));
                }
            });
        });
    } finally {
        // 4. Cleanup temp file
        try {
            await fs.unlink(tempPdfPath);
        } catch (e) {
            console.error("Failed to delete temporary PDF file:", e);
        }
    }
}

/**
 * FFmpeg Handler
 * 
 * This module handles processing video/audio files using FFmpeg.
 * 
 * Features:
 * - Downloads input files from URLs
 * - Processes files using FFmpeg with custom command chains
 * - Automatically creates output directories
 * - Cleans up temporary files after processing
 */

import { IHandlerResponse } from "../types";
import { runProcess, runcmd } from "../utils";
import { z } from "zod";
import path from "path";
import fs from "fs";

const fsPath = process.env.FS_PATH || ".";

// ============================================================================
// Types and Schemas
// ============================================================================

export const processSchema = z.object({
  inputs: z.array(z.object({
    url: z.string(),
  })),
  chainCmds: z.array(z.string()),
  output: z.string(),
});

type ProcessConfig = z.infer<typeof processSchema>;

// ============================================================================
// Input Processing Helpers
// ============================================================================

/**
 * Downloads input files from URLs to a temporary directory
 */
async function downloadInputFiles(
  inputs: { url: string }[],
  inputTempDir: string
): Promise<string[]> {
  await fs.promises.mkdir(inputTempDir, { recursive: true });
  
  console.log(`Downloading ${inputs.length} input file(s) in parallel...`);
  
  const downloadPromises = inputs.map(async (input, i) => {
    const extension = input.url.split('.').pop()?.split('?')[0] || 'mp4';
    const inputPath = `${inputTempDir}/input_${i}.${extension}`;
    
    try {
      await runcmd(`wget -O "${inputPath}" "${input.url}"`);
      console.log(`✓ Downloaded input ${i + 1}/${inputs.length}`);
      return inputPath;
    } catch (error) {
      console.log(`✗ Failed to download input ${i + 1}:`, error);
      return null;
    }
  });

  const results = await Promise.all(downloadPromises);
  const inputPaths = results.filter((path): path is string => path !== null);
  
  console.log(`Successfully downloaded ${inputPaths.length}/${inputs.length} input file(s)`);
  return inputPaths;
}

/**
 * Updates chain commands to reference downloaded input files
 */
function updateChainCommands(
  chainCmds: string[],
  inputPaths: string[]
): string[] {
  const updatedCmds = [...chainCmds];
  let inputIndex = 0;

  // Replace input placeholders with actual downloaded file paths
  for (let i = 0; i < updatedCmds.length; i++) {
    const cmd = updatedCmds[i];
    const [key, value] = cmd.split(" ");
    
    if (key === "-i" && inputIndex < inputPaths.length) {
      // Replace with downloaded file path (remove fsPath prefix as runProcess adds it)
      updatedCmds[i] = `-i ${inputPaths[inputIndex].replace(`${fsPath}/`, "")}`;
      inputIndex++;
    }
  }

  return updatedCmds;
}

// ============================================================================
// Main Process Handler
// ============================================================================

export const processHandler = async (body: ProcessConfig): Promise<IHandlerResponse> => {
  const inputTempDir = `${fsPath}/tmp/inputs_${Date.now()}`;
  let inputPaths: string[] = [];

  try {
    console.log(`Starting FFmpeg processing...`);
    console.log(`Output: ${body.output}`);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(`${fsPath}/${body.output}`);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Download input files
    if (body.inputs && body.inputs.length > 0) {
      console.log(`Processing ${body.inputs.length} input file(s)...`);
      inputPaths = await downloadInputFiles(body.inputs, inputTempDir);

      if (inputPaths.length === 0) {
        throw new Error('Failed to download any input files');
      }

      if (inputPaths.length < body.inputs.length) {
        console.log(`Warning: Only ${inputPaths.length}/${body.inputs.length} input files downloaded successfully`);
      }

      // Update chain commands with downloaded file paths
      const updatedChainCmds = updateChainCommands(body.chainCmds, inputPaths);
      
      console.log(`Running FFmpeg with ${updatedChainCmds.length} command(s)...`);
      await runProcess({
        chainCmds: updatedChainCmds,
        output: body.output,
      });
    } else {
      // No inputs to download, run directly
      console.log(`Running FFmpeg with ${body.chainCmds.length} command(s)...`);
      await runProcess({
        chainCmds: body.chainCmds,
        output: body.output,
      });
    }

    console.log(`FFmpeg processing completed successfully`);

    return {
      status: 200,
      data: {
        outputs: [{
          filename: path.basename(body.output),
          path: `${fsPath}/${body.output}`,
        }],
      },
    };
  } catch (error) {
    console.log(`Error processing FFmpeg`);
    console.log(error);
    return {
      status: 400,
      data: {
        error: error.message || "Error processing FFmpeg",
      },
    };
  } finally {
    // Clean up downloaded input files
    if (inputPaths.length > 0) {
      try {
        await runcmd(`rm -rf ${inputTempDir}`);
        console.log(`Temporary input files cleaned up`);
      } catch (cleanupError) {
        console.log(`Warning: Failed to clean up temporary input files:`, cleanupError);
      }
    }
  }
};



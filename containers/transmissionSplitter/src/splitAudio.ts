import { spawn } from "child_process";
import { ensurePathExists, getSourceAudioDir, getSplitAudioDir } from "./tempDir.js";
import { promises as fsPromise } from "fs";
import * as path from "path";

//
//  Functions
//

/**
 * Runs a command as a subprocess, and waits until execution has finished. Throws if the command
 * returns a non-zero exit code.
 *
 * @param executablePath The path to the executable to run
 * @param args The arguments to pass into the executable
 * @returns
 */
function runCommand(executablePath: string, args: string[], onDataCallback?: (chunk: any) => void) {
  return new Promise<void>((resolve, reject) => {
    const spawnedProcess = spawn(executablePath, args);

    // If there's some error... REJECT
    spawnedProcess.on("error", (err) => reject(err));

    // If we have a callback for processing data, and there is some data... call the callback!
    if (onDataCallback) spawnedProcess.stdout.on("data", (chunk) => onDataCallback(chunk));

    // Once the process exits...
    spawnedProcess.on("exit", (code, signal) => {
      // If there was a non-standard exit, REJECT
      if (code != 0) {
        reject(new Error(`Non-zero exit code (${code})`));
      }
      // If the process exited normally... RESOLVE
      else {
        resolve();
      }
    });
  });
}

//
//  Exports
//

/**
 * Splits an audio file into 4 tracks using demucs, then stores it in the temporary working
 * directory.
 *
 * @param id The ID of the audio transmission to split. Expected to have already been loaded into
 *   the temporary directory.
 */
export default async function splitAudio(id: string) {
  // Where demucs will spit out our split audio
  const pathToCurrentSplitDir = path.join("split", "htdemucs", id);

  try {
    // Tell demucs to split our audio.
    await runCommand(
      "python",
      ["-u", "-m", "demucs", `"${path.join(getSourceAudioDir(id), id)}"`],
      (chunk) => {
        console.log(chunk);
      },
    );

    // Make sure we have a spot to store the split audio
    const whereToPutSplitAudio = getSplitAudioDir(id);
    await ensurePathExists(whereToPutSplitAudio);

    // Loop through all stems that demucs spat out, in parallel...
    const newStems: string[] = await fsPromise.readdir(pathToCurrentSplitDir);
    await Promise.all(
      newStems.map(async (stemName) => {
        // ... and copy the stem to the temp working dir
        await fsPromise.rename(
          path.join(pathToCurrentSplitDir, stemName), // The old file path
          path.join(whereToPutSplitAudio, stemName), // The new file path
        );
      }),
    );
  } catch (exception) {
    throw exception;
  } finally {
    // Regardless of success or fail - clean up the folder that demucs may have created
    await fsPromise.rm(pathToCurrentSplitDir, { recursive: true, force: true });
  }
}

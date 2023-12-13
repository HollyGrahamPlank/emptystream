import { spawn } from "child_process";

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
 * Splits an audio file into 4 tracks using demucs, then stores it at `separated/htdemucs/{fileName}
 *
 * @param fileName The name of the audio file to split
 */
export default async function splitAudio(fileName: string) {
  await runCommand("python", ["-u", "-m", "demucs", `"${fileName}"`], (chunk) => {
    console.log(chunk);
  });
}

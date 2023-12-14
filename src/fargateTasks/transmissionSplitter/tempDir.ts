import { promises as fsPromise } from "fs";
import * as path from "path";

export async function ensurePathExists(pathToCheck: string) {
  await fsPromise.mkdir(pathToCheck, { recursive: true });
}

export function getTempDirPath(transmissionId: string): string {
  return path.join("tmp", transmissionId);
}

export function getSourceAudioDir(transmissionId: string): string {
  return path.join(getTempDirPath(transmissionId), "source");
}

export function getSplitAudioDir(transmissionId: string): string {
  return path.join(getTempDirPath(transmissionId), "split");
}

export async function cleanupTemporaryWorkingDir(transmissionId: string) {
  await fsPromise.rm(getTempDirPath(transmissionId), { recursive: true, force: true });
}

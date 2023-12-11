import { APIGatewayProxyEvent } from "aws-lambda";
import busboy, { Busboy } from "busboy";
import FileTooLargeError from "./fileTooLargeError.js";
import ParseMultipartError from "./parseMultipartError.js";

//
//  Interfaces
//

/** Configures the behaviour of `parseMultipart()`. */
export interface IParseMultipartConfig {
  /**
   * Which files we should parse and buffer, from the given multipart data. When parsing, if a file
   * field has a name that is also contained in this array, it will be buffered and stored in the
   * return result of the parse multipart function. If a file field does NOT have a name contained
   * in this array, it will be skipped and ignored entirely.
   *
   * @default [ ]
   */
  filesToParse: string[];

  /**
   * The maximum size (in bytes) that a single file in the given multipart data can be.
   *
   * @default Infinity
   */
  maxFileSize: number;

  /**
   * The maximum size (in bytes) that a single non-file field in the given multipart data can be.
   *
   * @default Infinity
   */
  maxFieldSize: number;
}

/** The default values for IParseMultipartConfig, as defined above. */
const parseMultipartConfigDefaults: IParseMultipartConfig = {
  filesToParse: [],
  maxFileSize: Infinity,
  maxFieldSize: Infinity,
};

/** All of the parsed data from the given multipart data, formatted as a basic JSON object. */
export interface IParsedMultipart {
  /**
   * Each parsed file and non-file field. If this is a non-file, it'll be a string. If it's a file,
   * it'll be the file buffer.
   */
  [fieldName: string]: string | Buffer | ParseMultipartError | undefined;
}

//
//  Functions
//

/**
 * Given some busboy stream, await until the stream is closed.
 *
 * @param multipartStream The Busboy stream to wait on.
 * @returns
 */
async function waitForStreamEnd(multipartStream: Busboy): Promise<Busboy> {
  return new Promise((resolve) => {
    multipartStream.on("close", () => {
      resolve(multipartStream);
    });
  });
}

/**
 * Parses all non-file fields from some Busboy stream. Stream must be populated, or actively BEING
 * populated for this, because this promise will only resolve when the busboy stream has closed.
 *
 * @param multipartStream The Busboy stream to parse non-file fields from.
 * @returns A map of each field and it's value.
 */
async function parseFields(multipartStream: Busboy) {
  const parsedFields = new Map<string, string>();

  // Whenever a field is encountered, store it in the above map
  multipartStream.on("field", (name, value) => {
    parsedFields.set(name, value);
  });

  // Wait until we've parsed all data, then return the parsed data!
  await waitForStreamEnd(multipartStream);
  return parsedFields;
}

/**
 * Parses some select file fields from some Busboy stream. Stream must be populated, or actively
 * BEING populated for this, because this promise will only resolve when the busboy stream has
 * closed.
 *
 * @param multipartStream The Busboy stream to parse file fields from.
 * @param filesToParse When a file is encountered in the stream, it will be ignored if it's field
 *   name is not in this list.
 * @returns A map of each field and the buffered file it belongs to.
 */
async function parseFiles(multipartStream: Busboy, filesToParse: string[]) {
  const parsedFiles = new Map<string, Buffer>();

  // Whenever a file is encountered, try to store it in the above map
  multipartStream.on("file", (name, stream) => {
    // If this is NOT a file we're listening for, IGNORE THIS
    if (!filesToParse.includes(name)) return;

    // Create a place to store streamed chunks of data
    const streamDataChunks: any[] = [];

    // If this file is large than our max limit, flag that this has happened
    // so we stop actually storing data.
    stream.on("limit", () => {
      throw new FileTooLargeError(name);
    });

    // Whenever chunks of this file come in, store them in the above array
    stream.on("data", (chunk) => {
      streamDataChunks.push(chunk);
    });

    // Once there are no more file chunks, join them all together
    // into a buffer and store them in our return result.
    stream.on("close", () => {
      parsedFiles.set(name, Buffer.concat(streamDataChunks));
    });
  });

  // Wait until we've parsed all data, then return the parsed data!
  await waitForStreamEnd(multipartStream);
  return parsedFiles;
}

/**
 * Given an APIGateway event (typically passed in to a lambda handler), parse any multipart data
 * contained in the body and return a usable output.
 *
 * This will parse non-file fields automatically. This will also parse and BUFFER file fields, but
 * only if the name of the file-field that you want is stored `inputConfig.filesToParse`.
 *
 * @param event The APIGateway / lambda event to parse the multipart data from.
 * @param inputConfig A configuration that determines how multipart data should get parsed.
 * @returns IParsedMultipart Parsed fields and buffered files.
 */
export async function parseMultipart(
  event: APIGatewayProxyEvent,
  inputConfig: Partial<IParseMultipartConfig> = {},
): Promise<IParsedMultipart> {
  // Create a full config, using our defaults and the values that this function provides.
  const config: IParseMultipartConfig = { ...parseMultipartConfigDefaults, ...inputConfig };

  // Construct the stream that will parse the multipart data from the AWS lambda.
  const multipartStream = busboy({
    headers: event.headers,
    limits: { fileSize: config.maxFileSize, fieldSize: config.maxFieldSize },
  });

  // Construct promises that will parse fields and files from busboy
  const parseFieldsPromise = parseFields(multipartStream);
  const parseFilesPromise = parseFiles(multipartStream, config.filesToParse);

  // Before awaiting these promises, pump busboy full of data! We need data before the above
  // funcs will work.
  multipartStream.write(event.body);
  multipartStream.destroy();

  // Wait for the parsing to finish...
  const [parsedFields, parsedFiles] = await Promise.all([parseFieldsPromise, parseFilesPromise]);

  // ...and once everything has been parsed - store it properly and exit!
  const parsedData: IParsedMultipart = {};

  parsedFields.forEach((value, key) => {
    parsedData[key] = value;
  });

  parsedFiles.forEach((value, key) => {
    parsedData[key] = value;
  });

  return parsedData;
}

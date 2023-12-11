import { APIGatewayProxyEvent } from "aws-lambda";
import busboy from "busboy";

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
  [fieldName: string]: string | Buffer | undefined;
}

//
//  Functions
//

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
  return new Promise((resolve, reject) => {
    try {
      // Create a full config, using our defaults and the values that this function provides.
      const config: IParseMultipartConfig = { ...parseMultipartConfigDefaults, ...inputConfig };

      // Create a structure to store and return the parsed fields and files.
      const parsedData: IParsedMultipart = {};

      // Construct the stream that will parse the multipart data from the AWS lambda.
      const multipartStream = busboy({
        headers: event.headers,
        limits: { fileSize: config.maxFileSize, fieldSize: config.maxFieldSize },
      });

      // Define how to handle fields in the multipart data
      multipartStream.on("field", (name, value) => {
        parsedData[name] = value;
      });

      // Define how to handle files in the multipart data
      multipartStream.on("file", (name, stream) => {
        // If this is NOT a file we're listening for, IGNORE THIS
        if (!config.filesToParse.includes(name)) return;

        // Create a place to store streamed chunks of data
        const streamDataChunks: any[] = [];

        // Whenever chunks of this file come in, store them in the above array
        stream.on("data", (chunk) => {
          streamDataChunks.push(chunk);
        });

        // Once there are no more file chunks, join them all together
        // into a buffer and store them in our return result.
        stream.on("end", () => {
          parsedData[name] = Buffer.concat(streamDataChunks);
        });
      });

      // Define what to do when we have finished parsing all of the data
      multipartStream.on("close", () => {
        // Resolve the promise, using all of the data that we have parsed across the above
        // callbacks.
        resolve(parsedData);
      });

      // Write the actual event bytes into the multipart stream parser, then close up the stream.
      // Because we handle data in the above callbacks, this should resolve the promise.
      multipartStream.write(event.body);
      multipartStream.destroy();
    } catch (e) {
      reject(e);
    }
  });
}

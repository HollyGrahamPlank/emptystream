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

/** A single parsed NON-FILE field from the given multipart data. */
export interface IParsedMultipartField {
  /** The name of this field. */
  name: string;

  /** The value of this field as a string. May need to be cast. */
  value: string;

  /** The raw info about this field. This contains things like encoding and mimeType. */
  info: busboy.FieldInfo;
}

/** A single parsed FILE field from the given multipart data. */
export interface IParsedMultipartFile {
  /**
   * The name of this field. NOT the file-name - specifically the name of the field that this file
   * is contained in.
   */
  name: string;

  /** The file itself, stored inside a buffer. */
  fileBuffer: Buffer;

  /**
   * The raw info about this field. This contains things like the original filename, encoding, and
   * mimeType.
   */
  info: busboy.FileInfo;
}

/** All of the parsed data from the given multipart data, formatted in a digestible way. */
export interface IParsedMultipart {
  /**
   * All fields found in the given multipart data.
   *
   * The key is the name of a non-file field, and it's value is parsed info about the field itself.
   */
  fields: Map<string, IParsedMultipartField>;

  /**
   * All files found in the given multipart data that have a field name matching a value in
   * `IParseMultipartConfig.filesToParse`.
   *
   * The key is the name of the file field, and it's value is parsed info about the file field
   * itself (INCLUDING the buffered file).
   */
  files: Map<string, IParsedMultipartFile>;
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
      const parsedData: IParsedMultipart = {
        fields: new Map<string, IParsedMultipartField>(),
        files: new Map<string, IParsedMultipartFile>(),
      };

      // Construct the stream that will parse the multipart data from the AWS lambda.
      const multipartStream = busboy({
        headers: event.headers,
        limits: { fileSize: config.maxFileSize, fieldSize: config.maxFieldSize },
      });

      // Define how to handle fields in the multipart data
      multipartStream.on("field", (name, value, info) => {
        parsedData.fields.set(name, {
          name,
          value,
          info,
        });
      });

      // Define how to handle files in the multipart data
      multipartStream.on("file", (name, stream, info) => {
        // If this is NOT a file we're listening for, IGNORE THIS
        if (!config.filesToParse.includes(name)) return;

        // if this IS a file we're listening for, read it all into a buffer and save it
        // for our output.
        parsedData.files.set(name, {
          name,
          // TODO - for some reason this read method is returning null. FIX THIS!
          fileBuffer: stream.read(),
          info,
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

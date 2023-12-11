import { APIGatewayProxyEvent } from "aws-lambda";
import busboy from "busboy";

export interface IParseMultipartConfig {
  filesToParse: string[];
}

export interface IParsedMultipartField {
  name: string;
  value: string;
  info: busboy.FieldInfo;
}

export interface IParsedMultipartFile {
  name: string;
  fileBuffer: Buffer;
  info: busboy.FileInfo;
}

export interface IParsedMultipart {
  fields: Map<string, IParsedMultipartField>;
  files: Map<string, IParsedMultipartFile>;
}

export async function parseMultipart(
  event: APIGatewayProxyEvent,
  input_config: Partial<IParseMultipartConfig> = {},
): Promise<IParsedMultipart> {
  return new Promise((resolve, reject) => {
    try {
      const defaultConfig: IParseMultipartConfig = {
        filesToParse: [],
      };
      const config: IParseMultipartConfig = { ...defaultConfig, ...input_config };

      const parsedData: IParsedMultipart = {
        fields: new Map<string, IParsedMultipartField>(),
        files: new Map<string, IParsedMultipartFile>(),
      };

      // Construct the stream that will parse the multipart data from the AWS lambda.
      const multipartStream = busboy({ headers: event.headers });

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

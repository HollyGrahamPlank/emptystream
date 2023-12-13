// Read the ID of the transmission we want to split from the env vars
const transmissionId: string = process.env["ID"] || "";
if (!transmissionId) throw new Error("No transmission ID given");

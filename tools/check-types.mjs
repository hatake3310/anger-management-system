import path from "node:path";
import process from "node:process";
import ts from "typescript";

function reportDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (diagnostic.file && typeof diagnostic.start === "number") {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start,
    );
    const fileName = path.relative(process.cwd(), diagnostic.file.fileName);
    console.error(`${fileName}(${line + 1},${character + 1}): error TS${diagnostic.code}: ${message}`);
  } else {
    console.error(`TS${diagnostic.code}: ${message}`);
  }
}

function main() {
  const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    console.error("Unable to locate tsconfig.json for the TypeScript compiler.");
    process.exitCode = 1;
    return;
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    reportDiagnostic(configFile.error);
    process.exitCode = 1;
    return;
  }

  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  if (parsedCommandLine.errors.length > 0) {
    parsedCommandLine.errors.forEach(reportDiagnostic);
    process.exitCode = 1;
    return;
  }

  const program = ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: parsedCommandLine.options,
    projectReferences: parsedCommandLine.projectReferences,
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    diagnostics.forEach(reportDiagnostic);
    process.exitCode = 1;
    return;
  }

  console.log("TypeScript lint passed without issues.");
}

main();

function main(): void {
  const root = DriveApp.getFolderById("ROOT_FOLDER_ID");
  run(root, root.getName());
  Logger.log("Done");
}

function run(folder: GoogleAppsScript.Drive.Folder, path: string): void {
  const subDirs = folder.getFolders();
  while (subDirs.hasNext()) {
    const subDir = subDirs.next();
    run(subDir, path + "/" + subDir.getName());
  }
  removeDuplicateFiles(folder, path);
}

function removeDuplicateFiles(folder: GoogleAppsScript.Drive.Folder, path: string): void {
  // Comparing blobs would be the most effective way of comparing
  // It would also work for Google Workspace files but it is probably much slower to
  // request and process blobs. Comparing file size should still have a low number of false positives
  // Comparing blobs just for Google Workspace files could be useful
  // (as there is no other way to compare them)
  // The size of shortcuts is undocumented but it is (hopefully) 0
  // File.getTargetId() is available but adds another request to every file and possibly folder

  // {fileName: Set(fileSize)}
  // This results in O(n) while storing minimal data in memory
  let fileSizes: Map<string, Set<GoogleAppsScript.Integer>> = new Map();
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const fileSize = file.getSize();
    if (fileSize === 0) {
      // Google Workspace file
      continue;
    }
    const filePath = path + "/" + fileName;
    let fileNameSizes = fileSizes.get(fileName) || new Set();
    if (fileNameSizes.has(fileSize)) {
      file.setTrashed(true);
      Logger.log(`Deleted ${filePath}`);
      continue;
    } else if (fileNameSizes.size !== 0) {
      Logger.log(`Skipped ${filePath}`);
    }
    fileSizes.set(fileName, fileNameSizes.add(fileSize));
  }
}

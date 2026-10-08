import * as path from "node:path";

type PathApi = {
  resolve: (...paths: string[]) => string;
  relative: (from: string, to: string) => string;
  isAbsolute: (path: string) => boolean;
  sep: string;
};

export type ProtocolPathResult =
  | { kind: "ok"; file: string }
  | { kind: "bad-request" }
  | { kind: "forbidden" };

export function resolveProtocolPath(
  root: string,
  pathname: string,
  pathApi: PathApi = path,
): ProtocolPathResult {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { kind: "bad-request" };
  }
  if (decodedPath.includes("\0")) return { kind: "forbidden" };

  const file = pathApi.resolve(root, `.${decodedPath}`);
  const localPath = pathApi.relative(root, file);
  const escapesRoot =
    localPath === ".." ||
    localPath.startsWith(`..${pathApi.sep}`) ||
    pathApi.isAbsolute(localPath);
  return escapesRoot
    ? { kind: "forbidden" }
    : { kind: "ok", file };
}

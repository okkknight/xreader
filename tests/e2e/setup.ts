import { execFileSync } from "node:child_process";

export default function setup() {
  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "db:migrate"], { cwd: process.cwd(), stdio: "inherit" });
  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "db:seed"], { cwd: process.cwd(), stdio: "inherit" });
}

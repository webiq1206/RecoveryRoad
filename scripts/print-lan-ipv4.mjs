import os from "node:os";

for (const name of Object.keys(os.networkInterfaces())) {
  for (const net of os.networkInterfaces()[name] ?? []) {
    const v4 = net.family === "IPv4" || net.family === 4;
    if (v4 && !net.internal) {
      console.log(net.address);
      process.exit(0);
    }
  }
}
console.error("No non-internal IPv4 found.");
process.exit(1);

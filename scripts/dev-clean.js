const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const lockPath = path.join(__dirname, "..", ".next", "dev", "lock")
try {
  fs.unlinkSync(lockPath)
  console.log("Lock eliminado.")
} catch {
  // Lock no existe
}

// Liberar puerto 3000 si está ocupado (opcional)
try {
  execSync("npx -y kill-port 3000", { stdio: "ignore" })
} catch {
  // Puerto libre o kill-port no disponible
}

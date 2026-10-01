const http = require("http")
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "dist")
const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || "127.0.0.1"

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0])
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "")
  let filePath = path.join(root, safePath)

  if (!filePath.startsWith(root)) {
    res.writeHead(403)
    res.end("Forbidden")
    return
  }

  if (!path.extname(filePath)) filePath = path.join(root, "index.html")

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404)
          res.end("Not found")
          return
        }
        res.writeHead(200, { "Content-Type": types[".html"] })
        res.end(fallback)
      })
      return
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" })
    res.end(data)
  })
}).listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}`)
})

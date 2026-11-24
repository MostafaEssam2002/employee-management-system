// Downloads a file from an authenticated endpoint (the session cookie is sent) and saves it in the browser
import { assertAuthorized } from './session'

async function DownloadFile(url, fallbackName = 'download') {
    const response = await fetch(url, { method: "GET", credentials: "include" })
    assertAuthorized(response, url)

    if (!response.ok) {
        // errors come back as JSON ({ message }); the file itself is not JSON
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || `Download failed (${response.status})`)
    }

    const disposition = response.headers.get("Content-Disposition") || ""
    const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
}
export default DownloadFile

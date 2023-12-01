import { JSDOM } from 'jsdom'
import { writeFile, readFile } from "fs/promises"

async function loadData() {
    try {
        return await readFile("rss.html", "utf-8")
    } catch {
        const r = await (await fetch(`https://crt.sh/?q=cloudimg.io`)).text()
        await writeFile("rss.html", r)
        return r
    }
}

function analysis(data: string) {
    const dom = new JSDOM(data)
    const all = Array.from(dom.window.document.querySelectorAll("td tr")).slice(1).map(i => {
        return {
            t: i.children[3].innerHTML,
            n: i.children[5].innerHTML
        }
    })
    const fin: string[] = []
    const now = Date.now()
    for (const i of all) {
        if (new Date(i.t).getTime() >= now) {
            i.n.split("<br>").forEach((j) => {
                if (!fin.includes(j)) fin.push(j)
            })
        }
    }
    return fin
}

async function check(urls: string[]) {
    const image = "https://koroneko.co/img/1.png"
    const fin: { name: string, status: number, length: string }[] = []
    const t = Date.now()
    const meta = await fetch(image)
    console.log(meta.headers.get("Content-Length"))
    for (const i of urls) {
        if (!["www.cloudimg.io", "*.cloudimg.io", "cloudimg.io"].includes(i)) {
            try {
                const r = await fetch(`https://${i}/v7/${image}?t=${t}`, {
                    "headers": {
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6",
                        "user-agent": "\"Microsoft Edge\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
                        "Accept-Encoding": "gzip, deflate, br",
                        "referer": "https://exhentai.org"
                    },
                });
                if (r.status >= 200 && r.status <= 299 && ["cached_original", "downloaded"].includes(r.headers.get("x-resource-status") ?? "")) {
                    fin.push({ name: i, status: r.status, length: r.headers.get("content-length") as string })
                }
                console.log("INFO", i, r.status, r.headers.get("content-length"), r.headers.get("x-resource-status"))
            } catch {
                console.log("ERROR", i)
            }

        }
    }
    return fin
}

loadData()
    .then((e) => {
        // writeFile("img.json", JSON.stringify(analysis(e)))
        check(analysis(e))
            .then((e) => {
                writeFile("img.json", JSON.stringify(e))
            })
    })
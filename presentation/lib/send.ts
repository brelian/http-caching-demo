export default function send(req: any, res: any) {
  // etag
  res.headers.set("etag", etagFn(res.body));

  // revalidate
  const reqHeaders = {
    "if-none-match": req.headers.get("if-none-match"),
    "if-modified-since": req.headers.get("if-modified-since"),
    "cache-control": req.headers.get("cache-control")
  }
  const resHeaders = {
    "etag": res.headers.get("etag"),
    "last-modified": res.headers.get("last-modified"),
  }

  const isFresh = fresh(reqHeaders, resHeaders);
  if (isFresh) {
    res.body = "";
    res.status = 304;
  }
}

function fresh(reqHeaders: any, resHeaders: any) {
  const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/
  // fields
  const modifiedSince = reqHeaders['if-modified-since']
  const noneMatch = reqHeaders['if-none-match']

  // unconditional request
  if (!modifiedSince && !noneMatch) {
    return false
  }

  // Always return stale when Cache-Control: no-cache
  // to support end-to-end reload requests
  // https://tools.ietf.org/html/rfc2616#section-14.9.4
  const cacheControl = reqHeaders['cache-control']
  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false
  }

  // if-none-match
  if (noneMatch && noneMatch !== '*') {
    const etag = resHeaders['etag']

    if (!etag && etag !== noneMatch) {
      return false
    }
  }

  // if-modified-since
  if (modifiedSince) {
    const lastModified = resHeaders['last-modified']
    const modifiedStale = !lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince))

    if (modifiedStale) {
      return false
    }
  }

  return true
}

function parseTokenList (str: string) {
  let end = 0
  let start = 0
  const list = []

  // gather tokens
  for (let i = 0, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = i + 1
        }
        break
      case 0x2c: /* , */
        list.push(str.substring(start, end))
        start = end = i + 1
        break
      default:
        end = i + 1
        break
    }
  }

  // final token
  list.push(str.substring(start, end))

  return list
}

function parseHttpDate (date: any) {
  const timestamp = date && Date.parse(date)

  // istanbul ignore next: guard against date.js Date.parse patching
  return typeof timestamp === 'number'
    ? timestamp
    : NaN
}

function etagFn(body: any) {
  return `W/rQYfuZO00e3jjS2qbbzpow`
}
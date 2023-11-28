export const objectFromUrlParams = <T = Record<string | number, any>>(
  params: string
): T => {
  const urlParams = new URLSearchParams(params)
  // @ts-expect-error
  const obj: T = {}

  for (const [key, value] of urlParams) {
    if (!value || value === "undefined") continue

    try {
      obj[key] = JSON.parse(decodeURIComponent(value))
    } catch (error) {
      obj[key] = decodeURIComponent(value)
    }
  }

  console.log(`params: ${params}`)
  console.log(`urlParams: ${urlParams}`)
  console.log(`obj: ${JSON.stringify(obj, null, 2)}`)

  return obj
}

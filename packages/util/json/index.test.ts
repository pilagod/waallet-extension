import json, { format, replacer } from "~packages/util/json"

describe("json", () => {
  const data = {
    jsonrpc: "1.0",
    id: 2,
    x: BigInt("345"),
    rpIdHash: new Uint8Array([0x06, 0x07, 0x08])
  }

  it("should format the JSON data using the format() function", () => {
    const output = format(data)
    const expected = `{
  "jsonrpc": "1.0",
  "id": 2,
  "x": 345,
  "rpIdHash": "060708"
}`

    expect(output).toBe(expected)
  })

  it("should format the JSON data using the format() function with uint8ArrayToHexString replacer", () => {
    const output = format(data, replacer.uint8ArrayToHexString)
    const expected = `{
  "jsonrpc": "1.0",
  "id": 2,
  "x": 345,
  "rpIdHash": "060708"
}`

    expect(output).toBe(expected)
  })

  it("should format the JSON data using the format() function with numberToHex replacer", () => {
    const output = format(data, replacer.numberToHex)
    const expected = `{
  "jsonrpc": "1.0",
  "id": "0x02",
  "x": "0x0159",
  "rpIdHash": "060708"
}`

    expect(output).toBe(expected)
  })

  it("should format the JSON data using the format() function with custom replacer", () => {
    const customReplacer = (k: any, v: any) => {
      if (k === "id") {
        return v
      }
      return replacer.numberToHex(k, v)
    }
    const output = format(data, customReplacer)
    const expected = `{
  "jsonrpc": "1.0",
  "id": 2,
  "x": "0x0159",
  "rpIdHash": "060708"
}`

    expect(output).toBe(expected)
  })

  it("should format the JSON data using the json.stringify() function", () => {
    const output = json.stringify(data)

    expect(output).toBe(
      `{"jsonrpc":"1.0","id":2,"x":345,"rpIdHash":{"0":6,"1":7,"2":8}}`
    )
  })

  it("should format the JSON data using the json.stringify() function with uint8ArrayToHexString replacer", () => {
    const output = json.stringify(data, replacer.uint8ArrayToHexString)

    expect(output).toBe(`{"jsonrpc":"1.0","id":2,"x":345,"rpIdHash":"060708"}`)
  })

  it("should format the JSON data using the json.stringify() function with numberToHex replacer", () => {
    const output = json.stringify(data, replacer.numberToHex)

    expect(output).toBe(
      `{"jsonrpc":"1.0","id":"0x02","x":"0x0159","rpIdHash":{"0":"0x06","1":"0x07","2":"0x08"}}`
    )
  })

  it("should format the JSON data using the json.stringify() function with custom replacer", () => {
    const customReplacer = (k: any, v: any) => {
      if (k === "id") {
        return v
      }
      return replacer.numberToHex(k, v)
    }
    const output = json.stringify(data, customReplacer)

    expect(output).toBe(
      `{"jsonrpc":"1.0","id":2,"x":"0x0159","rpIdHash":{"0":"0x06","1":"0x07","2":"0x08"}}`
    )
  })
})

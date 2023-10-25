import { useState } from "react"

import "~style.css"

function OptionsIndex() {
  const [data, setData] = useState("")

  return (
    <div className="flex flex-col p-16 text-red-500">
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <h2>This is the Option UI page!</h2>
      <input onChange={(e) => setData(e.target.value)} value={data} />
    </div>
  )
}

export default OptionsIndex

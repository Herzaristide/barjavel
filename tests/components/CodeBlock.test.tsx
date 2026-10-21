import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CodeBlock } from "../../app/components/CodeBlock"

function stubClipboard(writeText: ReturnType<typeof vi.fn> | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

describe("CodeBlock", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("copie le code puis réaffiche « Copier » après 1,5 s", async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    render(<CodeBlock>const a = 1</CodeBlock>)

    const btn = screen.getByRole("button", { name: "Copier le code" })
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(btn.textContent).toBe("Copié")

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(btn.textContent).toBe("Copier")
  })

  it("ignore un refus du presse-papiers", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("refusé"))
    stubClipboard(writeText)
    render(<CodeBlock>x</CodeBlock>)
    const btn = screen.getByRole("button", { name: "Copier le code" })
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(btn.textContent).toBe("Copier")
  })

  it("ne plante pas sans API presse-papiers", () => {
    stubClipboard(undefined)
    render(<CodeBlock>x</CodeBlock>)
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow()
  })
})

import { useCallback } from 'react'

export function usePrint(targetId: string) {
  const print = useCallback(() => {
    const el = document.getElementById(targetId)
    if (!el) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>NoQ · Prescription</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 24px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }, [targetId])

  return { print }
}

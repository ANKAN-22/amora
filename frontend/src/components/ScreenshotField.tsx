import type { ChangeEvent } from 'react'

type ScreenshotFieldProps = {
  preview: string
  reading: boolean
  onFile: (event: ChangeEvent<HTMLInputElement>) => void
}

export function ScreenshotField({ preview, reading, onFile }: ScreenshotFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">Enrollment screenshot</span>
      <input name="screenshot" type="file" accept="image/*" className="sr-only" onChange={onFile} />
      {preview ? (
        <img
          src={preview}
          alt="Enrollment screenshot preview"
          className="h-52 w-full rounded-[1.6rem] object-cover ring-1 ring-black/5"
        />
      ) : (
        <span className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-coral/50 bg-blush px-6 text-center text-sm font-semibold text-coral">
          {reading ? 'Reading image…' : 'Upload screenshot'}
        </span>
      )}
      {preview ? (
        <span className="mt-2 block text-center text-xs font-semibold text-coral">Replace screenshot</span>
      ) : null}
    </label>
  )
}

import { useRef } from 'react'
import type { TimeFormat } from '../utils/timeFormat'

interface ClockSettingsProps {
  timeFormat: TimeFormat
  onTimeFormatChange: (format: TimeFormat) => void
  storageError: string | null
  onOpenChange: (open: boolean) => void
}

export default function ClockSettings({ timeFormat, onTimeFormatChange, storageError, onOpenChange }: ClockSettingsProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        className="face-navigation-button"
        aria-label="Clock settings"
        aria-haspopup="dialog"
        title="Clock settings"
        onClick={() => {
          dialog.current?.showModal()
          onOpenChange(true)
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 3h4l.6 3 1.6.9 2.8-1 2 3.5-2.2 2v1.8l2.2 2-2 3.5-2.8-1-1.6.9-.6 3h-4l-.6-3-1.6-.9-2.8 1-2-3.5 2.2-2v-1.8L3 9.4l2-3.5 2.8 1L9.4 6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        className="clock-settings-dialog"
        aria-labelledby="clock-settings-title"
        onClose={() => onOpenChange(false)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            dialog.current?.close()
          }
        }}
      >
        <div className="clock-settings-header">
          <h2 id="clock-settings-title">Clock settings</h2>
          <button
            type="button"
            className="face-navigation-button"
            aria-label="Close settings"
            onClick={() => dialog.current?.close()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <fieldset>
          <legend>Time format</legend>
          <label className="clock-format-option">
            <input
              type="radio"
              name="time-format"
              value="12"
              checked={timeFormat === '12'}
              onChange={() => onTimeFormatChange('12')}
            />
            <span>12-hour <small>01-12, AM/PM</small></span>
          </label>
          <label className="clock-format-option">
            <input
              type="radio"
              name="time-format"
              value="24"
              checked={timeFormat === '24'}
              onChange={() => onTimeFormatChange('24')}
            />
            <span>24-hour <small>00-23</small></span>
          </label>
        </fieldset>
        <p className="clock-settings-description">Applies immediately to every clock face and is saved in this browser.</p>
        <p className="clock-settings-description"><a href="/controller" target="_blank" rel="noopener noreferrer">Open clock controller</a></p>
        {storageError && <p className="clock-settings-error" role="alert">{storageError}</p>}
      </dialog>
    </>
  )
}

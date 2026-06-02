import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-primary-dark">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-surface rounded-xl text-sm text-primary-dark
            placeholder:text-light-blue outline-none
            focus:ring-2 focus:ring-primary/20
            disabled:opacity-50
            ${error ? 'ring-2 ring-red-400' : ''}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-light-blue">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

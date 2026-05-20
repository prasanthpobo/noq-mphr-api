import { ReactNode, InputHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import clsx from 'clsx'

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  register: UseFormRegisterReturn
  icon?: ReactNode
}

export default function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  icon,
  ...rest
}: InputFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Label */}
      <label
        htmlFor={name}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: error ? '#EF4444' : '#3D4A5B',
          letterSpacing: '0.1px',
        }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Leading icon */}
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: error ? '#EF4444' : '#6B7C93',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {icon}
          </span>
        )}

        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...register}
          {...rest}
          className={clsx('noq-input', icon && 'has-icon', error && 'has-error')}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            border: `1.5px solid ${error ? '#EF4444' : '#E3EAF2'}`,
            background: '#FFFFFF',
            paddingLeft: icon ? '40px' : '14px',
            paddingRight: '14px',
            fontSize: '15px',
            color: '#1A1A1A',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? '#EF4444' : '#2C6ED5'
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(239,68,68,0.12)'
              : '0 0 0 3px rgba(44,110,213,0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#EF4444' : '#E3EAF2'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#EF4444',
            fontWeight: 400,
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

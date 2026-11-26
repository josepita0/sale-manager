import { useState } from 'react'
import { OjoIcon, OjoTachadoIcon } from './icons'

type PasswordInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
}

/** Password field with an eye toggle to show or hide the value (login, create and edit user). */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-lg border border-hair-fuerte bg-papel pl-3.5 pr-11 text-[15px] text-tinta placeholder:text-tinta-suave/70"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-tinta-suave transition-colors hover:text-tinta"
      >
        {visible ? <OjoTachadoIcon className="h-5 w-5" /> : <OjoIcon className="h-5 w-5" />}
      </button>
    </div>
  )
}

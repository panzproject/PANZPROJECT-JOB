import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import type { InputHTMLAttributes } from 'react'

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = '',
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="field__required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  hint?: string
  error?: string
  prefix?: string
  fieldClassName?: string
}

export function TextField({
  label,
  hint,
  error,
  prefix,
  fieldClassName,
  required,
  className = '',
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const id = props.name ? `${props.name}-${generatedId}` : generatedId
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <div className={`input-wrap${prefix ? ' input-wrap--prefix' : ''}${error ? ' input-wrap--error' : ''}`}>
        {prefix ? <span className="input-prefix">{prefix}</span> : null}
        <input id={id} className={`input ${className}`.trim()} required={required} {...props} />
      </div>
    </Field>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string
  hint?: string
  error?: string
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className = '',
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId()
  const id = props.name ? `${props.name}-${generatedId}` : generatedId
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        className={`textarea ${className}`.trim()}
        required={required}
        {...props}
      />
    </Field>
  )
}

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> & {
  label: string
  options: SelectOption[]
  hint?: string
  error?: string
  placeholder?: string
  fieldClassName?: string
}

export function SelectField({
  label,
  options,
  hint,
  error,
  placeholder,
  fieldClassName,
  required,
  className = '',
  ...props
}: SelectFieldProps) {
  const generatedId = useId()
  const id = props.name ? `${props.name}-${generatedId}` : generatedId
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <div className={`select-wrap${error ? ' select-wrap--error' : ''}`}>
        <select id={id} className={`select ${className}`.trim()} required={required} {...props}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className={`switch-field${disabled ? ' is-disabled' : ''}`}>
      <div className="switch-field__copy">
        <label htmlFor={id} className="switch-field__label">
          {label}
        </label>
        {description ? <p className="switch-field__description">{description}</p> : null}
      </div>
      <label className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
      </label>
    </div>
  )
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
  error,
  disabled,
}: {
  label: ReactNode
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className={`checkbox-field${error ? ' has-error' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <div>
        <label htmlFor={id}>{label}</label>
        {description ? <p className="checkbox-field__description">{description}</p> : null}
        {error ? <p className="field__error" role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

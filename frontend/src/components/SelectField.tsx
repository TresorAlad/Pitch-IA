import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { SelectOption } from '../types/select'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SelectField({
  id, label, value, options, onChange,
  placeholder = 'Choisir…', disabled = false,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false); setHi(-1)
      }
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  useEffect(() => {
    if (isOpen && hi >= 0 && listRef.current) {
      (listRef.current.children[hi] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
    }
  }, [hi, isOpen])

  function pick(o: SelectOption) { onChange(o.value); setIsOpen(false); setHi(-1) }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return
    const idx = options.findIndex((o) => o.value === value)
    switch (e.key) {
      case 'Enter': case ' ':
        e.preventDefault()
        if (isOpen && hi >= 0) pick(options[hi])
        else { setIsOpen(true); setHi(Math.max(0, idx)) }
        break
      case 'Escape': setIsOpen(false); setHi(-1); break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) { setIsOpen(true); setHi(Math.max(0, idx)) }
        else setHi((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) setHi((i) => Math.max(0, i - 1))
        break
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label htmlFor={id} className="field-label">{label}</label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        onKeyDown={onKey}
        className="field-input"
        style={{
          display: 'flex', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none', textAlign: 'left',
          ...(isOpen ? { borderColor: '#99251f', boxShadow: '0 0 0 3px rgba(153,37,31,0.1)' } : {}),
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? 600 : 400, color: selected ? '#111009' : '#9c9690' }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{ flexShrink: 0, color: '#9c9690', transition: 'transform 150ms', transform: isOpen ? 'rotate(180deg)' : 'none', marginLeft: 6 }}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute', zIndex: 100, top: 'calc(100% + 4px)', left: 0, right: 0,
            margin: 0, padding: '4px 0', listStyle: 'none',
            background: '#fff',
            border: '1.5px solid #e4e0dc',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            maxHeight: 220, overflowY: 'auto',
          }}
        >
          {options.map((opt, i) => {
            const sel = opt.value === value
            const hov = i === hi
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={sel}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(opt)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8, margin: '0 4px', padding: '9px 12px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 14,
                  background: sel ? '#99251f' : hov ? '#f5ebe9' : 'transparent',
                  color: sel ? '#fff' : '#111009',
                  fontWeight: sel ? 600 : 500,
                  transition: 'background 100ms',
                }}
              >
                <span>
                  <span style={{ display: 'block' }}>{opt.label}</span>
                  {opt.description && (
                    <span style={{ fontSize: 12, opacity: 0.65, display: 'block', marginTop: 1 }}>{opt.description}</span>
                  )}
                </span>
                {sel && <Check size={14} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export type { SelectOption }

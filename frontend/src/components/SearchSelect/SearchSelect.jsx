import { useEffect, useMemo, useRef, useState } from 'react'
import './SearchSelect.scss'

const MAX_VISIBLE = 100

// Searchable dropdown (ARIA combobox). The visible input is only for searching;
// the chosen id is submitted through a hidden input named `name`.
// options: [{ value, label, meta? }]
const SearchSelect = ({
    id,
    name,
    label,
    value,
    options,
    onChange,
    placeholder,
    Icon,
    disabled = false,
    isLoading = false,
    loadError = '',
    onRetry,
    emptyText = 'No results found',
    hasError = false,
    ...rest
}) => {
    const [query, setQuery] = useState(null) // null = not typing -> show the selected label
    const [isOpen, setIsOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef(null)

    const listboxId = `${id}-listbox`
    const optionId = (index) => `${id}-option-${index}`

    const selected = options.find((o) => String(o.value) === String(value))
    const inputText = query ?? selected?.label ?? ''
    const showPanel = isOpen && !disabled

    const matches = useMemo(() => {
        const q = (query ?? '').trim().toLowerCase()
        if (!q) return options
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || String(o.value).includes(q)
        )
    }, [options, query])
    const visible = matches.slice(0, MAX_VISIBLE)
    const active = Math.min(activeIndex, Math.max(visible.length - 1, 0))

    useEffect(() => {
        if (!showPanel) return
        document.getElementById(`${id}-option-${active}`)?.scrollIntoView?.({ block: 'nearest' })
    }, [showPanel, active, id])

    const open = () => {
        if (disabled || isOpen) return
        const index = selected ? options.indexOf(selected) : 0
        setActiveIndex(index >= MAX_VISIBLE ? 0 : index)
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
        setQuery(null)
    }

    const select = (option) => {
        onChange(option.value)
        close()
    }

    const handleInputChange = (e) => {
        setQuery(e.target.value)
        setActiveIndex(0)
        setIsOpen(true)
        // editing the text drops the previous choice so the id and the text can never disagree
        if (value !== '') onChange('')
    }

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                if (!showPanel) open()
                else setActiveIndex(Math.min(active + 1, visible.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                if (showPanel) setActiveIndex(Math.max(active - 1, 0))
                break
            case 'Enter':
                if (showPanel) {
                    e.preventDefault() // don't submit the form while picking an option
                    if (visible[active]) select(visible[active])
                }
                break
            case 'Escape':
                if (showPanel) {
                    e.preventDefault()
                    close()
                }
                break
            default:
        }
    }

    const handleChevronClick = () => {
        if (showPanel) {
            close()
        } else {
            inputRef.current?.focus()
            open()
        }
    }

    const emptyMessage = query?.trim() ? `No results for “${query.trim()}”` : emptyText

    return (
        <div className="form-field__control search-select">
            {Icon && (
                <span className="form-field__icon">
                    <Icon />
                </span>
            )}

            <input
                {...rest}
                ref={inputRef}
                id={id}
                type="text"
                role="combobox"
                aria-expanded={showPanel}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={showPanel && visible.length ? optionId(active) : undefined}
                autoComplete="off"
                className={`form-input search-select__input${hasError ? ' form-input--error' : ''}`}
                placeholder={placeholder}
                value={inputText}
                disabled={disabled}
                onChange={handleInputChange}
                onFocus={open}
                onClick={open}
                onBlur={close}
                onKeyDown={handleKeyDown}
            />

            {/* what the form actually submits; data-numeric makes SubmitForm send it as a number */}
            <input type="hidden" name={name} value={value} data-numeric="true" />

            <button
                type="button"
                tabIndex={-1}
                className="search-select__chevron"
                aria-label={showPanel ? 'Close options' : 'Open options'}
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleChevronClick}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {showPanel && (
                // keep focus in the input while the pointer is inside the panel
                <div className="search-select__panel" onMouseDown={(e) => e.preventDefault()}>
                    <ul id={listboxId} role="listbox" aria-label={label} className="search-select__list">
                        {isLoading ? (
                            <li role="presentation" className="search-select__status">Loading…</li>
                        ) : loadError ? (
                            <li role="presentation" className="search-select__status search-select__status--error">
                                {loadError}
                                {onRetry && (
                                    <button type="button" className="search-select__retry" onClick={onRetry}>
                                        Try again
                                    </button>
                                )}
                            </li>
                        ) : visible.length === 0 ? (
                            <li role="presentation" className="search-select__status">{emptyMessage}</li>
                        ) : (
                            visible.map((option, index) => (
                                <li
                                    key={option.value}
                                    id={optionId(index)}
                                    role="option"
                                    aria-selected={String(option.value) === String(value)}
                                    className={
                                        'search-select__option' +
                                        (index === active ? ' search-select__option--active' : '') +
                                        (String(option.value) === String(value) ? ' search-select__option--selected' : '')
                                    }
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => select(option)}
                                >
                                    <span className="search-select__label">{option.label}</span>
                                    {option.meta && <span className="search-select__meta">{option.meta}</span>}
                                </li>
                            ))
                        )}
                        {matches.length > MAX_VISIBLE && (
                            <li role="presentation" className="search-select__hint">
                                Showing the first {MAX_VISIBLE} of {matches.length} — keep typing to narrow it down
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default SearchSelect
import React, {
  useId,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Select = forwardRef(({
  label,
  error,
  hint,
  id: explicitId,
  hideLabel = false,
  size = 'md',
  className = '',
  children,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled = false,
  name,
  ...props
}, forwardedRef) => {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const isSmall = size === 'sm';

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const nativeSelectRef = useRef(null);
  const listboxRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });

  // Merge forwardedRef and internal nativeSelectRef
  const setMergedRef = useCallback((el) => {
    nativeSelectRef.current = el;
    if (typeof forwardedRef === 'function') {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  }, [forwardedRef]);

  // Parse option elements from children
  const options = useMemo(() => {
    const list = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === 'option') {
        list.push({
          value: child.props.value !== undefined ? String(child.props.value) : '',
          label: child.props.children,
          disabled: Boolean(child.props.disabled)
        });
      }
    });
    return list;
  }, [children]);

  // Internal value management
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => {
    if (isControlled) return String(value);
    if (defaultValue !== undefined) return String(defaultValue);
    return options[0]?.value ?? '';
  });

  useEffect(() => {
    if (isControlled) {
      setInternalValue(String(value));
    }
  }, [isControlled, value]);

  // Synchronize with native select if uncontrolled
  useEffect(() => {
    if (!isControlled && nativeSelectRef.current && nativeSelectRef.current.value !== internalValue) {
      setInternalValue(nativeSelectRef.current.value);
    }
  }, [isControlled, options]);

  const selectedValue = isControlled ? String(value) : internalValue;
  const selectedOption = options.find((opt) => String(opt.value) === String(selectedValue)) || options[0];

  // Calculate dropdown positioning
  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;

      setCoords({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        openUp
      });
    }
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateCoords]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        listboxRef.current && !listboxRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleSelectOption = (optValue, optDisabled) => {
    if (optDisabled || disabled) return;

    if (!isControlled) {
      setInternalValue(optValue);
    }
    setIsOpen(false);
    triggerRef.current?.focus();

    if (nativeSelectRef.current) {
      nativeSelectRef.current.value = optValue;
    }

    if (onChange) {
      onChange({
        target: {
          value: optValue,
          name,
          id
        },
        type: 'change'
      });
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const idx = options.findIndex((opt) => String(opt.value) === String(selectedValue));
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < options.length && options[next].disabled) {
          next++;
        }
        return next < options.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && options[next].disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const opt = options[highlightedIndex];
        if (!opt.disabled) {
          handleSelectOption(opt.value, false);
        }
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(isSmall ? 'inline-block relative' : 'w-full relative')}
    >
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium text-ink',
            isSmall ? 'mb-0' : 'mb-1.5',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}

      {/* Hidden native select for form integration and accessibility */}
      <select
        ref={setMergedRef}
        id={id}
        name={name}
        value={selectedValue}
        defaultValue={defaultValue}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        onBlur={onBlur}
        {...props}
      >
        {children}
      </select>

      {/* Custom Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={`${id}-trigger`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            const idx = options.findIndex((opt) => String(opt.value) === String(selectedValue));
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        onBlur={(e) => {
          if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
            onBlur?.(e);
          }
        }}
        className={cn(
          'relative flex w-full items-center justify-between gap-2 rounded-md border bg-surface text-ink transition-all duration-150 text-left outline-none',
          'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
          isSmall
            ? 'h-9 px-2.5 text-xs font-medium'
            : 'h-11 md:h-10 px-3 text-base md:text-sm',
          error
            ? 'border-danger text-ink focus-visible:border-danger focus-visible:ring-danger/20'
            : isOpen
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-line-strong hover:border-ink-muted/50',
          disabled && 'bg-surface-muted text-ink-subtle opacity-60 cursor-not-allowed hover:border-line-strong',
          className
        )}
      >
        <span className="truncate block flex-1">
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <ChevronDown
          size={isSmall ? 14 : 16}
          className={cn(
            'text-ink-subtle shrink-0 transition-transform duration-200 ease-out',
            isOpen && 'rotate-180 text-accent'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Portal Dropdown Menu */}
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listboxRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={label || 'Options'}
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              minWidth: `${Math.max(coords.width, 160)}px`,
              zIndex: 9999
            }}
            className={cn(
              'rounded-lg border border-line bg-surface p-1 shadow-xl shadow-black/15 dark:shadow-black/50 max-h-60 overflow-y-auto outline-none transition-all duration-150 backdrop-blur-md',
              coords.openUp ? 'origin-bottom' : 'origin-top'
            )}
          >
            {options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(selectedValue);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={`${opt.value}-${idx}`}
                  id={`${id}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt.value, opt.disabled)}
                  onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                  className={cn(
                    'group relative flex items-center justify-between gap-3 rounded-md cursor-pointer select-none transition-colors duration-100',
                    isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
                    isSelected
                      ? 'bg-accent-soft text-accent-soft-fg font-medium'
                      : isHighlighted
                      ? 'bg-surface-muted text-ink'
                      : 'text-ink hover:bg-surface-muted',
                    opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={isSmall ? 13 : 15}
                      className="text-accent shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}

      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-subtle mt-1.5">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;

import { useState, useEffect, useRef } from 'react';

/**
 * SearchableSelect Component
 * A premium, searchable dropdown for long lists.
 * 
 * @param {Array} options - [{ value: string|number, label: string }]
 * @param {any} value - current selected value
 * @param {Function} onChange - (value) => void
 * @param {string} placeholder - default text
 * @param {boolean} disabled - disabled state
 * @param {string} className - additional classes
 */
export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option...", 
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setHighlightedIndex(-1);
    } else {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSelect(filteredOptions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`searchable-select-wrapper ${className} ${disabled ? 'disabled' : ''}`} 
      ref={wrapperRef}
      style={{ position: 'relative', width: '100%' }}
    >
      <style>{`
        .searchable-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--input-bg, #1e293b);
          border: 1px solid var(--border, #334155);
          border-radius: 12px;
          color: var(--text);
          cursor: pointer;
          min-height: 48px;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .searchable-select-trigger:hover { border-color: var(--primary); }
        .searchable-select-trigger.open { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.2); }
        .searchable-select-wrapper.disabled .searchable-select-trigger { cursor: not-allowed; opacity: 0.5; }

        .searchable-select-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #0f172a;
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4);
          z-index: 9999;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .searchable-select-input-wrap {
          padding: 12px;
          border-bottom: 1px solid var(--border);
        }
        .searchable-select-input {
          width: 100%;
          padding: 8px 12px;
          background: #1e293b;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
        }
        .searchable-select-input:focus { border-color: var(--primary); }

        .searchable-select-options {
          max-height: 240px;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .searchable-select-option {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 0.88rem;
          color: var(--text2);
          transition: all 0.1s;
        }
        .searchable-select-option:hover, .searchable-select-option.highlighted {
          background: rgba(37,99,235,0.1);
          color: var(--primary);
        }
        .searchable-select-option.selected {
          background: var(--primary);
          color: #fff;
        }
        .searchable-select-no-results {
          padding: 20px;
          text-align: center;
          color: var(--text3);
          font-size: 0.85rem;
        }
      `}</style>

      <div 
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ 
          color: selectedOption ? 'var(--text)' : 'var(--text3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginRight: 8
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-input-wrap">
            <input 
              ref={inputRef}
              type="text"
              className="searchable-select-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={opt.value}
                  className={`searchable-select-option ${opt.value === value ? 'selected' : ''} ${i === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="searchable-select-no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

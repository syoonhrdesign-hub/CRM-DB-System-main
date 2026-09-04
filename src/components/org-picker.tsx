"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * 고객사 고르기 — 이름을 쳐서 찾는다.
 *
 * 고객사가 690곳을 넘어 긴 <select> 로는 스크롤로 찾기 어렵다.
 * 글자를 치면 목록이 줄어들고, 방향키·Enter 로 고르거나 마우스로 누른다.
 * 실제 폼 값은 숨은 input(name=organizationId) 에 id 로 들어간다.
 *
 * 필수 항목이면 "글자만 치고 목록에서 안 고른" 상태를 잡아 브라우저 검증 문구로 알린다.
 */

type Org = { id: string; name: string };

/** 비교용 — 대소문자와 공백을 무시한다 (예: "CJ ENM" ≒ "cjenm") */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

const MAX_SHOWN = 60;

export function OrgPicker({
  organizations,
  name = "organizationId",
  defaultValue,
  required,
  placeholder = "고객사 이름을 입력하세요",
  emptyLabel = "선택 안 함",
}: {
  organizations: Org[];
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  /** 필수가 아닐 때 비워 두는 항목의 이름 */
  emptyLabel?: string;
}) {
  const initial = defaultValue ? organizations.find((o) => o.id === defaultValue) : undefined;
  const [selected, setSelected] = useState<Org | null>(initial ?? null);
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return organizations.slice(0, MAX_SHOWN);
    // 앞부분이 맞는 것을 먼저, 그다음 중간에 들어 있는 것
    const starts: Org[] = [];
    const contains: Org[] = [];
    for (const o of organizations) {
      const n = norm(o.name);
      if (n.startsWith(q)) starts.push(o);
      else if (n.includes(q)) contains.push(o);
      if (starts.length >= MAX_SHOWN) break;
    }
    return [...starts, ...contains].slice(0, MAX_SHOWN);
  }, [organizations, query]);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // "글자는 있는데 고른 게 없다"를 브라우저 검증에 얹는다
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (required && !selected && query.trim()) {
      el.setCustomValidity("목록에서 고객사를 골라 주세요.");
    } else {
      el.setCustomValidity("");
    }
  }, [required, selected, query]);

  function choose(o: Org | null) {
    setSelected(o);
    setQuery(o?.name ?? "");
    setOpen(false);
  }

  function onChange(v: string) {
    setQuery(v);
    setOpen(true);
    setCursor(0);
    // 고른 뒤 글자를 고치면 선택이 풀린다 — 이름과 값이 어긋나지 않게
    if (selected && v !== selected.name) setSelected(null);
  }

  function onBlur() {
    // 이름을 끝까지 정확히 쳤으면 고른 것으로 친다
    if (!selected && query.trim()) {
      const exact = organizations.find((o) => norm(o.name) === norm(query));
      if (exact) setSelected(exact);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      if (open && matches[cursor]) {
        e.preventDefault(); // 폼 제출 대신 선택
        choose(matches[cursor]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />

      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          className="input pr-8"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          data-org-picker
          data-selected-id={selected?.id ?? ""}
        />
        {query && (
          <button
            type="button"
            aria-label="지우기"
            title="지우기"
            onClick={() => {
              choose(null);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 px-2.5 text-faint hover:text-ink"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-[var(--shadow-md)]"
        >
          {!required && !query && (
            <li
              role="option"
              aria-selected={!selected}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(null)}
              className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2"
            >
              {emptyLabel}
            </li>
          )}
          {matches.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-faint">
              &ldquo;{query}&rdquo; 에 맞는 고객사가 없습니다. 고객사 메뉴에서 먼저 등록해 주세요.
            </li>
          ) : (
            matches.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={selected?.id === o.id}
                onMouseDown={(e) => e.preventDefault()} // blur 로 목록이 먼저 닫히지 않게
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(o)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-sm ${
                  i === cursor ? "bg-accent-soft text-accent" : "hover:bg-surface-2"
                } ${selected?.id === o.id ? "font-semibold" : ""}`}
              >
                {o.name}
              </li>
            ))
          )}
          {organizations.length > MAX_SHOWN && matches.length >= MAX_SHOWN && (
            <li className="px-2.5 py-1.5 text-xs text-faint">
              {MAX_SHOWN}곳까지만 보입니다. 이름을 더 입력해 주세요.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

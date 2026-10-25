"use client";

import { Icon } from "./Icon";

export interface Sort<K extends string> {
  key: K;
  dir: "asc" | "desc";
}

/** A column header that sorts the table; a second click flips the direction. */
export function SortHeader<K extends string>({
  label,
  k,
  sort,
  onSort,
  num,
}: {
  label: string;
  k: K;
  sort: Sort<K>;
  onSort: (s: Sort<K>) => void;
  num?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th scope="col" className={num ? "adm-num" : undefined} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        className="adm-sort"
        data-active={active || undefined}
        onClick={() => onSort({ key: k, dir: active && sort.dir === "desc" ? "asc" : active ? "desc" : num || k === "submitted" ? "desc" : "asc" })}
      >
        {label}
        <Icon name={active ? (sort.dir === "asc" ? "up" : "down") : "sort"} size={14} />
      </button>
    </th>
  );
}

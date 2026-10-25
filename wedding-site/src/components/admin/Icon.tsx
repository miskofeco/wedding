// The admin's icon set: 20 × 20, 1.75 px round strokes, drawn for this site.
const paths = {
  overview: "M3.5 10.5 10 4l6.5 6.5M5.5 9v7h3.25v-4h2.5v4h3.25V9",
  answers: "M4 4.5h12v8.5H9l-3.5 3v-3H4zM7 8h6M7 10.5h4",
  invites: "M3.5 6h13v9h-13zM3.5 6.5 10 11l6.5-4.5",
  people: "M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 16c.5-2.6 2.3-4 4.5-4s4 1.4 4.5 4M13 4.2a2.4 2.4 0 0 1 0 4.6M14.5 12.2c1.3.6 2.2 1.9 2.5 3.8",
  content: "M4.5 3.5h7l4 4v9h-11zM11.5 3.5v4h4M7 11h6M7 13.5h4",
  search: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM13.5 13.5 17 17",
  plus: "M10 4.5v11M4.5 10h11",
  download: "M10 3.5v9M6.5 9 10 12.5 13.5 9M4 15.5h12",
  print: "M6 7.5V3.5h8v4M6 13.5H4V8h12v5.5h-2M6 11.5h8v5H6z",
  copy: "M7.5 7.5h8.5v8.5H7.5zM12.5 7.5V4H4v8.5h3.5",
  close: "M5 5l10 10M15 5 5 15",
  edit: "M4 16l.8-3.2L13 4.6a1.6 1.6 0 0 1 2.3 0l.1.1a1.6 1.6 0 0 1 0 2.3L7.2 15.2zM11.8 5.8l2.4 2.4",
  trash: "M4 6h12M8 6V4h4v2M5.5 6l.8 10h7.4l.8-10",
  up: "M10 15.5v-11M5.5 9 10 4.5 14.5 9",
  down: "M10 4.5v11M5.5 11l4.5 4.5 4.5-4.5",
  sync: "M15.5 8A6 6 0 0 0 5 6.2M4.5 3.5v3h3M4.5 12A6 6 0 0 0 15 13.8M15.5 16.5v-3h-3",
  external: "M11 4h5v5M16 4l-7 7M14 11.5V16H4V6h4.5",
  logout: "M8 4H4.5v12H8M12 6.5 15.5 10 12 13.5M15.5 10H8",
  bell: "M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 1.5h-13zM8.5 16.5a1.6 1.6 0 0 0 3 0",
  message: "M3.5 5h13v8h-7l-3.5 3v-3H3.5z",
  check: "M4.5 10.5 8 14l7.5-8",
  warning: "M10 3.5 17 16H3zM10 8.5v3.5M10 14.2v.1",
  sheet: "M4 3.5h12v13H4zM4 8h12M4 12.5h12M9 8v8.5",
  sort: "M7 4v12M4.5 6.5 7 4l2.5 2.5M13 16V4M10.5 13.5 13 16l2.5-2.5",
  chevron: "M8 5l5 5-5 5",
  phone: "M6 3.5h3l1 4-2 1.2a8 8 0 0 0 3.3 3.3l1.2-2 4 1v3a1.5 1.5 0 0 1-1.6 1.5A13 13 0 0 1 4.5 5.1 1.5 1.5 0 0 1 6 3.5Z",
  calendar: "M4 5h12v11H4zM4 8.5h12M7.5 3v3.5M12.5 3v3.5",
  globe: "M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM3.5 10h13M10 3.5c1.8 1.8 2.6 4 2.6 6.5S11.8 14.7 10 16.5C8.2 14.7 7.4 12.5 7.4 10S8.2 5.3 10 3.5Z",
  undo: "M7.5 6.5 4.5 9.5l3 3M4.5 9.5h7a4 4 0 0 1 0 8h-2",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `adm-icon ${className}` : "adm-icon"}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}

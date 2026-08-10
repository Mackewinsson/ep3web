"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { NotificationDto } from "@/lib/notifications";

function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function NotificationBell({
  initialItems,
  unreadCount,
}: {
  initialItems: NotificationDto[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(unreadCount);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialItems);
    setUnread(unreadCount);
  }, [initialItems, unreadCount]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function onItemClick(n: NotificationDto) {
    if (!n.readAt) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date() } : x,
          ),
        );
        setUnread((c) => Math.max(0, c - 1));
      });
    }
    setOpen(false);
  }

  function onMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date() })));
      setUnread(0);
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          unread > 0
            ? `Notificaciones, ${unread} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ep3-navy/15 text-ep3-navy hover:bg-ep3-navy/5"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ep3-yellow px-1 text-[10px] font-bold text-ep3-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-ep3-navy/15 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <p className="text-sm font-semibold text-ep3-navy">Notificaciones</p>
            {unread > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={onMarkAll}
                className="text-xs font-medium text-ep3-navy/70 underline hover:text-ep3-navy disabled:opacity-50"
              >
                Marcar todas leídas
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-400">
                No hay notificaciones
              </li>
            ) : (
              items.map((n) => {
                const content = (
                  <div className="flex gap-2">
                    {!n.readAt ? (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ep3-yellow"
                        aria-hidden
                      />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          n.readAt
                            ? "font-medium text-slate-700"
                            : "font-semibold text-ep3-navy"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li
                    key={n.id}
                    className={`border-b border-slate-50 last:border-0 ${
                      n.readAt ? "bg-white" : "bg-ep3-navy/[0.03]"
                    }`}
                  >
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => onItemClick(n)}
                        className="block px-3 py-3 hover:bg-slate-50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onItemClick(n)}
                        className="w-full px-3 py-3 text-left hover:bg-slate-50"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

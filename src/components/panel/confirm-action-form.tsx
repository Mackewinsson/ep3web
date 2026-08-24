"use client";

import { useCallback, useState } from "react";
import {
  useBodyScrollLock,
  useEscapeKey,
} from "@/components/panel/use-overlay";

export function ConfirmActionForm({
  action,
  triggerLabel,
  title,
  description,
  confirmLabel,
  triggerClassName,
  confirmClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerClassName: string;
  confirmClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useBodyScrollLock(open);
  useEscapeKey(open, close);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl">
            <h2
              id="confirm-action-title"
              className="text-lg font-semibold text-ep3-navy"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-ep3-navy/70">{description}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <form action={action} className="sm:flex-1">
                <button type="submit" className={confirmClassName}>
                  {confirmLabel}
                </button>
              </form>
              <button
                type="button"
                onClick={close}
                className="min-h-11 rounded-md border border-ep3-navy/20 px-3 py-2 text-sm text-ep3-navy sm:flex-1"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import "./ContactFab.css";

const TELEGRAM_URL = "https://t.me/Yeabsega";
const WHATSAPP_URL = "https://wa.me/";

export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!open) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="contact-fab" ref={menuRef}>
      {open && (
        <div className="contact-fab-menu" role="menu" aria-label="Contact options">
          <a
            className="contact-fab-item telegram"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
          >
            <span className="contact-fab-icon" aria-hidden="true">
              <i className="fa-brands fa-telegram"></i>
            </span>
            <span className="contact-fab-text">
              <strong>Telegram</strong>
              <small>Open Telegram</small>
            </span>
          </a>
          <a
            className="contact-fab-item whatsapp"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
          >
            <span className="contact-fab-icon" aria-hidden="true">
              <i className="fa-brands fa-whatsapp"></i>
            </span>
            <span className="contact-fab-text">
              <strong>WhatsApp</strong>
              <small>Chat on WhatsApp</small>
            </span>
          </a>
        </div>
      )}

      <button
        type="button"
        className="contact-fab-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Contact"
      >
        <i className="fa-solid fa-comments"></i>
      </button>
    </div>
  );
}


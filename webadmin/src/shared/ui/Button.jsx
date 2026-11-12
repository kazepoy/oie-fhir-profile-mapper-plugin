// SPDX-License-Identifier: MPL-2.0
import { Icon } from "./Icon.jsx";

export const cx = (...names) => names.filter(Boolean).join(" ");

/** A toolbar button. `icon` adds a leading icon; without children it is square and `label` names it. */
export function Tool({ icon, label, active, small, primary, danger, link, className, children, ...rest }) {
  const iconOnly = icon && children == null;
  return (
    <button type="button" title={label} aria-label={iconOnly ? label : undefined} aria-pressed={active === undefined ? undefined : !!active}
      className={cx("fm-tool", active && "fm-tool--active", small && "fm-tool--small", primary && "fm-tool--primary", danger && "fm-tool--danger", link && "fm-tool--link", className)} {...rest}>
      {icon ? <Icon name={icon} size={small ? 12 : 14} /> : null}
      {children}
    </button>
  );
}

/** A labelled field, laid out with Web Admin's own classes. */
export function Field({ label, hint, wide, children }) {
  return (
    <div className={cx("field", wide && "fm-wide")}>
      {label ? <label>{label}</label> : null}
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Message({ kind = "info", children }) {
  return <div className={`fm-message fm-message--${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export function Badge({ kind, title, children }) {
  return <span className={cx("fm-badge", kind && `fm-badge--${kind}`)} title={title}>{children}</span>;
}

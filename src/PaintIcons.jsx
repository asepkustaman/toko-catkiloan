import React from 'react';

function PaintIcon({ size = 18, strokeWidth = 1.9, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowDownToLine(props) {
  return <PaintIcon {...props}><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M4 16v4h16v-4" /><path d="M7 20h10" strokeWidth="2.8" /></PaintIcon>;
}

export function ArrowRight(props) {
  return <PaintIcon {...props}><path d="M4 12h14" /><path d="m13 6 6 6-6 6" strokeWidth="2.4" /><path d="M3 8v8" strokeWidth="2.6" opacity=".48" /></PaintIcon>;
}

export function BarChart3(props) {
  return <PaintIcon {...props}><path d="M4 19.5h16" /><path d="M6.5 16v-5m5 5V5m5 11V8" strokeWidth="3.2" /><path d="M5 8.5 10 5l4 2 5-4" strokeWidth="1.5" opacity=".68" /></PaintIcon>;
}

export function Boxes(props) {
  return <PaintIcon {...props}><path d="m12 3 8 4.2v9.2L12 21l-8-4.6V7.2L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v8.5" /><path d="m8 5.2 8 4.1" opacity=".55" /></PaintIcon>;
}

export function BriefcaseBusiness(props) {
  return <PaintIcon {...props}><path d="M4 8.5h16a1.5 1.5 0 0 1 1.5 1.5v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-9a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8M2.5 13h19M10 13v2h4v-2" /><path d="M5 17h2m10 0h2" opacity=".55" /></PaintIcon>;
}

export function Check(props) {
  return <PaintIcon {...props}><path d="m5 12.5 4.2 4.1L19.5 6" strokeWidth="2.8" /><path d="M4 20h16" strokeWidth="1.2" opacity=".38" /></PaintIcon>;
}

export function CircleDollarSign(props) {
  return <PaintIcon {...props}><circle cx="12" cy="12" r="9" strokeWidth="1.7" /><circle cx="12" cy="12" r="6.2" opacity=".36" strokeWidth="1" /><path d="M15.5 8.8c-.7-.8-1.8-1.2-3-1.2-1.6 0-2.8.8-2.8 2s1 1.8 2.8 2.3 2.8 1.1 2.8 2.4-1.2 2.2-3 2.2c-1.3 0-2.5-.5-3.3-1.4M12.3 6v12" strokeWidth="1.6" /></PaintIcon>;
}

export function ClipboardList(props) {
  return <PaintIcon {...props}><path d="M7 5H5.5A1.5 1.5 0 0 0 4 6.5v13A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 5H17" /><path d="M9 3.5h6A1.5 1.5 0 0 1 16.5 5v2h-9V5A1.5 1.5 0 0 1 9 3.5Z" /><path d="M8 11h8m-8 3.5h8m-8 3.5h5" /><path d="m7.5 11 1 1 1.5-1.5" strokeWidth="1.5" /></PaintIcon>;
}

export function CreditCard(props) {
  return <PaintIcon {...props}><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M3 9h18" strokeWidth="2.5" /><path d="M6 15h5" strokeWidth="2.2" /><path d="M16 15h2" opacity=".5" /></PaintIcon>;
}

export function LayoutDashboard(props) {
  return <PaintIcon {...props}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><path d="M6 6h2m8 0h4m-4 8h4M6 16h2" strokeWidth="1.35" opacity=".55" /></PaintIcon>;
}

export function LogOut(props) {
  return <PaintIcon {...props}><path d="M11 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H11" /><path d="M9 12h11m-4-4 4 4-4 4" strokeWidth="2.2" /><path d="M8 8v8" opacity=".42" /></PaintIcon>;
}

export function Menu(props) {
  return <PaintIcon {...props}><path d="M4 6.5h16M4 12h10M4 17.5h16" strokeWidth="2.4" /><circle cx="17.5" cy="12" r="1" fill="currentColor" stroke="none" /></PaintIcon>;
}

export function Package(props) {
  return <PaintIcon {...props}><path d="m12 3 8 4.2v9.5L12 21l-8-4.3V7.2L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 11.5V21" /><path d="m8 5 8 4.2" opacity=".5" /><path d="M9 14.5h6" strokeWidth="1.4" opacity=".65" /></PaintIcon>;
}

export function Pencil(props) {
  return <PaintIcon {...props}><path d="m4 16.8-.9 4.1 4.1-.9L19.4 7.8a2.1 2.1 0 0 0-3-3L4 16.8Z" /><path d="m14.8 6.4 3 3M3.5 21h6" strokeWidth="1.6" /><path d="m5 17.5 2.8 2.8" opacity=".48" /></PaintIcon>;
}

export function Plus(props) {
  return <PaintIcon {...props}><path d="M12 4v16M4 12h16" strokeWidth="2.5" /><path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5" strokeWidth="1.1" opacity=".38" /></PaintIcon>;
}

export function Search(props) {
  return <PaintIcon {...props}><circle cx="10.5" cy="10.5" r="6.8" /><path d="m15.5 15.5 5 5" strokeWidth="2.8" /><path d="M8.2 10.5h4.6" strokeWidth="1.2" opacity=".5" /></PaintIcon>;
}

export function Settings(props) {
  return <PaintIcon {...props}><path d="m9.5 3.5.6-1h3.8l.6 1 .3 1.8 1.6.9 1.8-.6 2 3.3-1.3 1.4v1.8l1.3 1.4-2 3.3-1.8-.6-1.6.9-.3 1.8-.6 1H10l-.6-1-.3-1.8-1.6-.9-1.8.6-2-3.3L5 12.2v-1.8L3.7 9l2-3.3 1.8.6 1.6-.9.4-1.9Z" /><circle cx="12" cy="11.3" r="3" /><path d="M12 8.3v1.1m0 3.8v1.1" strokeWidth="1.2" opacity=".55" /></PaintIcon>;
}

export function ShieldCheck(props) {
  return <PaintIcon {...props}><path d="M12 2.8 20 6v5.3c0 4.6-3.2 8.1-8 9.9-4.8-1.8-8-5.3-8-9.9V6l8-3.2Z" /><path d="m8.2 11.8 2.5 2.5 5.2-5.5" strokeWidth="2.2" /><path d="M12 5.5v1" opacity=".4" /></PaintIcon>;
}

export function ShoppingCart(props) {
  return <PaintIcon {...props}><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" /><path d="M9 12h10" strokeWidth="1.2" opacity=".45" /><circle cx="9.5" cy="20" r="1.3" fill="currentColor" /><circle cx="17.5" cy="20" r="1.3" fill="currentColor" /></PaintIcon>;
}

export function Trash2(props) {
  return <PaintIcon {...props}><path d="M4 7h16m-10-3h4l1 3H9l1-3Z" /><path d="m6 7 1 13h10l1-13" /><path d="M10 10v7m4-7v7" strokeWidth="1.5" /><path d="M3 7h18" strokeWidth="2.5" /></PaintIcon>;
}

export function TrendingUp(props) {
  return <PaintIcon {...props}><path d="M3 18.5h18" /><path d="m4.5 15.5 5-5 3.3 2.8 6.7-7" strokeWidth="2.2" /><path d="M14.8 6.3h4.7V11" strokeWidth="2.2" /><circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" /></PaintIcon>;
}

export function Truck(props) {
  return <PaintIcon {...props}><path d="M2.5 6h11v11h-11z" /><path d="M13.5 10h4l4 4v3h-8" /><path d="M17.5 10v4h4" /><circle cx="7" cy="18" r="2" fill="currentColor" fillOpacity=".18" /><circle cx="17" cy="18" r="2" fill="currentColor" fillOpacity=".18" /><path d="M4.5 9h5m-5 3h3" strokeWidth="1.25" opacity=".56" /></PaintIcon>;
}

export function X(props) {
  return <PaintIcon {...props}><path d="m6 6 12 12M18 6 6 18" strokeWidth="2.4" /><path d="M3.5 12h2m13 0h2" strokeWidth="1.3" opacity=".42" /></PaintIcon>;
}

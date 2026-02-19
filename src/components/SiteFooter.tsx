type Footer = {
  companyName: string
  companyInfo: string
  addressInfo: string
}

export default function SiteFooter({ footer }: { footer: Footer }) {
  return (
    <footer className="mt-10 border-t border-slate-800 bg-gradient-to-b from-slate-950/50 to-slate-950/80">
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-slate-300 space-y-2">
        <p className="font-semibold text-slate-100">{footer.companyName}</p>
        <p>{footer.companyInfo}</p>
        <p>{footer.addressInfo}</p>
        <p className="text-slate-500">© {new Date().getFullYear()} {footer.companyName}. All rights reserved.</p>
      </div>
    </footer>
  )
}

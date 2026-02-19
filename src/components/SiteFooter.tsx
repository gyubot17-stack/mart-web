type Footer = {
  companyName: string
  companyInfo: string
  addressInfo: string
}

export default function SiteFooter({ footer }: { footer: Footer }) {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/90">
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-slate-600 space-y-2">
        <p className="font-semibold text-slate-900">{footer.companyName}</p>
        <p>{footer.companyInfo}</p>
        <p>{footer.addressInfo}</p>
        <p className="text-slate-400">© {new Date().getFullYear()} {footer.companyName}. All rights reserved.</p>
      </div>
    </footer>
  )
}

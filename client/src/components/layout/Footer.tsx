export default function Footer() {
  return (
    <footer className="border-t p-4 text-center text-xs opacity-60 font-mono mt-auto shrink-0 flex flex-col md:flex-row justify-between items-center gap-2" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
      <div className="flex items-center gap-2">
        <span>SMARTLIB v1.0.0</span>
        <span>•</span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
      <div className="flex items-center gap-4">
        <a href="#" className="hover:underline hover:opacity-100 transition-opacity">Help & Documentation</a>
        <a href="#" className="hover:underline hover:opacity-100 transition-opacity">Contact Support</a>
      </div>
    </footer>
  );
}
